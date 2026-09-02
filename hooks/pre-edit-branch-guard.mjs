#!/usr/bin/env node
/**
 * PreToolUse hook. Stops the first edit that would land on a repo's default branch.
 *
 * Skill invocation is discretionary: the agent reads a name and a one-line description,
 * mid-list among every other skill the harness loaded, and decides. `branch-to-pr` says
 * to use it "before the first edit of any change that will be committed", which is the
 * hardest trigger point there is. At that moment the prompt is about the task, not about
 * where the task lands, so nothing in the wording suggests the skill.
 *
 * That trigger does not have to be predicted from a prompt. It can be observed. An edit
 * arriving while HEAD is the default branch IS the failure the skill exists to prevent,
 * and it is the same fact in every repo, for every user, in any phrasing. A hook testing
 * a condition generalizes where a table of anticipated situations does not.
 *
 * It denies once per repo per session and then stays quiet. A guard that fires on every
 * edit is one the agent learns to work around, and it would trap anyone who has decided,
 * legitimately, that this edit belongs on main. One denial delivers the instruction; the
 * retry is the agent's call.
 *
 * Two conditions carry that argument, not one. An edit on the default branch is the obvious
 * case. An edit on a branch whose remote was deleted is the same failure wearing a feature
 * branch's name: the pull request merged, the branch went with it, and the next edit lands
 * on work that is already history.
 *
 * It reads the tool input for a path, and falls back to sniffing a Bash command, because a
 * bash-first session writes files with `cat >` and never touches the Edit tool at all.
 *
 * Set THIAMINE_DEFAULT_BRANCH_GUARD=0 to turn it off.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { bashWrites } from './bash-target.mjs'

/** A branch is "default" if the remote says so, else by the two conventional names. */
const FALLBACK_DEFAULTS = new Set(['main', 'master'])

const git = (cwd, args) =>
	execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()

/** Walk up to the nearest directory that exists: a Write may name a file and parents that do not. */
function nearestExistingDir(filePath) {
	let dir = path.dirname(path.resolve(filePath))
	for (;;) {
		if (fs.existsSync(dir)) return dir
		const parent = path.dirname(dir)
		if (parent === dir) return null
		dir = parent
	}
}

function defaultBranchOf(cwd) {
	try {
		// origin/HEAD is the authoritative answer where it is set.
		return git(cwd, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']).replace(/^origin\//, '')
	} catch {
		return null
	}
}

/** Claude Code names a project directory after its absolute path, with slashes as dashes. */
const stateFile = (projectDir) =>
	path.join(os.homedir(), '.claude', 'projects', projectDir.replaceAll('/', '-'), '.thiamine-branch-guard.json')

function alreadyWarned(file, sessionId, repo) {
	try {
		const state = JSON.parse(fs.readFileSync(file, 'utf8'))
		// A new session starts over. The warning is about this session's first edit.
		if (state.sessionId !== sessionId) return false
		return state.repos.includes(repo)
	} catch {
		return false
	}
}

function recordWarned(file, sessionId, repo) {
	let state = { sessionId, repos: [] }
	try {
		const prior = JSON.parse(fs.readFileSync(file, 'utf8'))
		if (prior.sessionId === sessionId) state = prior
	} catch {
		// No usable state. The fresh one above stands.
	}
	state.repos.push(repo)
	fs.mkdirSync(path.dirname(file), { recursive: true })
	fs.writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`)
}

/**
 * Where this edit lands, from either tool shape. A Bash write that names no path, such as a
 * heredoc into python, still has a repo: the session's own directory.
 */
function targetOf(event) {
	const named = event.tool_input?.file_path ?? event.tool_input?.notebook_path
	if (named) return named
	if (event.tool_name !== 'Bash') return null

	const { writes, paths } = bashWrites(event.tool_input?.command ?? '')
	if (!writes) return null
	if (paths.length === 0) return event.cwd ? path.join(event.cwd, '.') : null
	return path.isAbsolute(paths[0]) ? paths[0] : path.join(event.cwd ?? '.', paths[0])
}

/**
 * A branch that has a remote configured but no upstream ref left was pushed and then
 * deleted, which is what merging does with `delete_branch_on_merge`. A branch that never
 * had a remote is just local, and editing on it is the point.
 */
function upstreamGone(cwd, branch) {
	try {
		git(cwd, ['config', '--get', `branch.${branch}.remote`])
	} catch {
		return false
	}
	try {
		git(cwd, ['rev-parse', '--verify', '--quiet', `${branch}@{upstream}`])
		return false
	} catch {
		return true
	}
}

const allow = () => process.exit(0)

try {
	if (process.env.THIAMINE_DEFAULT_BRANCH_GUARD === '0') allow()

	const event = JSON.parse(fs.readFileSync(0, 'utf8'))
	const filePath = targetOf(event)
	if (!filePath) allow()

	const dir = nearestExistingDir(filePath)
	if (!dir) allow()

	// Not a git repo, no commits, or a detached HEAD: nothing here is about to go wrong.
	let repo
	let branch
	try {
		repo = git(dir, ['rev-parse', '--show-toplevel'])
		branch = git(dir, ['symbolic-ref', '--short', 'HEAD'])
	} catch {
		allow()
	}

	const fallback = FALLBACK_DEFAULTS.has(branch)
	const defaultBranch = defaultBranchOf(dir)
	// Where origin/HEAD is set it decides, including when it names something unconventional.
	// Where it is not, main and master are the only guess worth making.
	const onDefault = defaultBranch ? branch === defaultBranch : fallback
	const spent = !onDefault && upstreamGone(dir, branch)
	if (!onDefault && !spent) allow()

	const projectDir = event.cwd || process.env.CLAUDE_PROJECT_DIR || repo
	const file = stateFile(projectDir)
	const sessionId = event.session_id || 'unknown'
	if (alreadyWarned(file, sessionId, repo)) allow()
	recordWarned(file, sessionId, repo)

	process.stdout.write(
		`${JSON.stringify({
			hookSpecificOutput: {
				hookEventName: 'PreToolUse',
				permissionDecision: 'deny',
				permissionDecisionReason:
					(onDefault
						? `This edit would land on ${branch}, the default branch of ${repo}. `
						: `This edit would land on ${branch} in ${repo}, whose remote branch is gone, so its ` +
							`pull request has already merged and these commits are history. `) +
					`Decide where the change goes before editing: load the thiamine:branch-to-pr skill, ` +
					`which puts it on a branch in a worktree. If this branch is genuinely right for this ` +
					`edit, say why and make it again. This fires once per repo per session and will not ` +
					`stop the retry.`,
			},
		})}\n`,
	)
	process.exit(0)
} catch {
	// Never block an edit over a guard. A crashed guard is a silent guard.
	allow()
}
