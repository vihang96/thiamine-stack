#!/usr/bin/env node
/**
 * SessionStart hook. Puts the workspace board into context when there is one.
 *
 * The gap this closes: `working-alongside` tells a session to read the board before
 * starting, and skill invocation is discretionary, so the session most likely to collide
 * is the one that never loaded the skill. A hook does not depend on the agent choosing to
 * look.
 *
 * What it does not do, deliberately: it does not announce anything on the session's behalf.
 * At session start there is no unit yet, and an entry whose `decides` reads "none" is the
 * noise that makes the next session stop trusting the board. Announcing stays the skill's
 * job, at the moment the work is named.
 *
 * It also cannot help the first session in a workspace, because an empty board has nothing
 * to report. Bootstrapping is a person or a skill, not this.
 *
 * Unlike the pass nudge beside it, this is not a suggestion competing for attention. It is
 * state the session needs in order not to destroy someone's work, so both may print in the
 * rare turn where each has something to say.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readStdin } from './nudge-state.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const LANES = path.join(HERE, '..', 'skills', 'working-alongside', 'scripts', 'lanes.sh')

const git = (cwd, args) =>
	execFileSync('git', args, { cwd, encoding: 'utf8', timeout: 4000, stdio: ['ignore', 'pipe', 'ignore'] }).trim()

/** Entries on a board, or null when there is no board with anything in it. */
const populated = (root) => {
	const dir = path.join(root, '.thiamine', 'lanes')
	try {
		return fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile()).length > 0
			? root
			: null
	} catch {
		return null
	}
}

try {
	const event = readStdin()
	const cwd = event.cwd || process.env.CLAUDE_PROJECT_DIR
	if (!cwd) process.exit(0)

	// The main checkout's parent is the workspace, and --git-common-dir gets there from a
	// linked worktree too. Falling back to the repo root covers a repo with no siblings,
	// which the playbook allows as long as readers and writers agree.
	const common = git(cwd, ['rev-parse', '--path-format=absolute', '--git-common-dir'])
	const repoRoot = path.dirname(common)
	const root = populated(path.dirname(repoRoot)) ?? populated(repoRoot)
	if (!root) process.exit(0)

	const board = execFileSync('sh', [LANES, root], { encoding: 'utf8', timeout: 4000 }).trim()

	// Modified tracked files at session start are either yours from last time or another
	// session's in progress, and in a shared checkout you cannot tell which by looking.
	let dirty = ''
	try {
		const changed = git(cwd, ['status', '--porcelain', '--untracked-files=no'])
		const n = changed ? changed.split('\n').length : 0
		if (n > 0) {
			dirty =
				`\n${n} tracked file(s) are already modified in this checkout. They are yours from ` +
				`a previous session or another session's work in progress, and nothing in the tree ` +
				`says which. Check before you stage anything, and never stage by wildcard here.`
		}
	} catch {
		// A status that will not run is not worth failing a session start over.
	}

	process.stdout.write(
		`Other work is announced in this workspace. Read this before starting, and judge ` +
			`overlap with the working-alongside skill rather than assuming.\n\n${board}\n${dirty}\n`,
	)
} catch {
	// Never break a session start over a report.
}

process.exit(0)
