/**
 * State the stack can route from, without being told a skill's name.
 *
 * A skill fires when the agent recognises the situation from a description, which needs the
 * user's phrasing to resemble the trigger. A condition in the repo does not: uncommitted work
 * on a branch that cannot be pushed is the same fact in every repo, in any phrasing, and the
 * `pre-edit-branch-guard` beside this file already makes that argument for one condition.
 *
 * Adding a signal is one entry in the list below. Nothing else changes: the presenter ranks,
 * budgets, and records whatever is here, so a signal cannot forget the one-per-session
 * discipline or the cooldown by being written carelessly.
 *
 * Every detector answers in the same shape and is allowed to answer nothing. A signal that
 * needs a tool the machine does not have, or a command that fails, is absent rather than
 * broken: `needs` is checked before `detect` runs, and `capture` swallows a non-zero exit.
 * A stack that only works with `gh` installed and authenticated is a stack that works on one
 * machine.
 *
 * Order is priority, because the presenter takes the first signal that fires. Local and cheap
 * comes before anything on the network, and where the change lands comes before bookkeeping.
 *
 * Set THIAMINE_SIGNALS=0 to silence all of them, or THIAMINE_SIGNAL_<NAME>=0 for one, with
 * the name upper-cased and hyphens as underscores.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/** Milliseconds any one detector may spend. A session start that waits is worse than a quiet one. */
const DETECT_TIMEOUT = 2500

/** Hours a fired condition stays quiet, so an ignored nudge does not become a nag. */
export const DEFAULT_COOLDOWN_HOURS = 20

const found = new Map()

/** Is this executable on PATH. Cached, because a session start asks the same question twice. */
export function hasTool(name) {
	if (!found.has(name)) {
		found.set(name, capture('sh', ['-c', `command -v ${name}`], process.cwd()) !== null)
	}
	return found.get(name)
}

/**
 * Run something and return its trimmed stdout, or null. A detector reads state and must never
 * be the reason a session start fails, so every failure mode collapses to "no answer": a
 * missing binary, a non-zero exit, no repo, no auth, a field this version does not have.
 */
export function capture(cmd, args, cwd) {
	try {
		return execFileSync(cmd, args, {
			cwd,
			encoding: 'utf8',
			timeout: DETECT_TIMEOUT,
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim()
	} catch {
		return null
	}
}

const git = (cwd, ...args) => capture('git', args, cwd)

/** The `Where:` line of a handoff record names the branch its work lives on. */
const branchOf = (record) => record.match(/^Where:.*?\b((?:feat|fix|chore|docs|refactor)\/[\w./-]+)/m)?.[1]

export const SIGNALS = [
	{
		name: 'unlanded-work',
		invoke: '/thiamine:branch-to-pr',
		detect: ({ cwd }) => {
			const branch = git(cwd, 'symbolic-ref', '--short', 'HEAD')
			if (!branch) return null
			const changed = git(cwd, 'status', '--porcelain', '--untracked-files=no')
			if (!changed) return null

			const upstream = git(cwd, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', `${branch}@{upstream}`)
			const configured = git(cwd, 'config', '--get', `branch.${branch}.remote`)
			const head = git(cwd, 'symbolic-ref', '--short', 'refs/remotes/origin/HEAD')

			// Three ways work has nowhere of its own to land, and the third is the one that bites:
			// `git worktree add -b` points a new branch at origin/HEAD, so it reads as tracked
			// while `git push` would target the default branch.
			let why = null
			if (!upstream && configured) why = ['gone', 'whose upstream is gone, so its pull request has already merged']
			else if (!upstream) why = ['none', 'which has no upstream']
			else if (head && upstream === head && branch !== head.replace(/^origin\//, ''))
				why = ['default', `which tracks ${upstream} rather than a branch of its own`]
			if (!why) return null

			const files = changed.split('\n').length
			return {
				key: `${branch}:${why[0]}`,
				says: `${files} modified file(s) are sitting on ${branch}, ${why[1]}`,
			}
		},
	},
	{
		name: 'stale-handoff',
		invoke: '/thiamine:handoff',
		detect: ({ cwd }) => {
			const root = git(cwd, 'rev-parse', '--show-toplevel')
			if (!root) return null
			const live = new Set((git(cwd, 'branch', '--format=%(refname:short)') ?? '').split('\n'))

			for (const file of fs.readdirSync(root).filter((f) => /^\.handoff-.*\.md$/.test(f))) {
				const branch = branchOf(fs.readFileSync(path.join(root, file), 'utf8'))
				if (!branch || live.has(branch)) continue
				return {
					key: `${file}:${branch}`,
					says: `${file} describes work on ${branch}, which no longer exists here`,
				}
			}
			return null
		},
	},
	{
		name: 'triage-due',
		invoke: '/thiamine:signal-to-task',
		detect: ({ cwd }) => {
			const root = git(cwd, 'rev-parse', '--show-toplevel')
			const dir = path.join(root ?? cwd, '.thiamine', 'triage')
			const sources = path.join(dir, 'sources.tsv')
			if (!fs.existsSync(sources)) return null

			const cadence = { daily: 1, weekly: 7 }
			for (const line of fs.readFileSync(sources, 'utf8').split('\n').slice(1)) {
				const [name, , , interval] = line.split(/\s{2,}|\t/).map((c) => c?.trim())
				if (!name || !cadence[interval]) continue

				const mark = path.join(dir, `${name}.watermark`)
				const last = fs.existsSync(mark) ? fs.statSync(mark).mtimeMs : 0
				const days = (Date.now() - last) / 86_400_000
				if (days < cadence[interval]) continue

				return {
					key: `${name}:${Math.floor(days)}`,
					says: last
						? `the ${name} sweep last ran ${Math.floor(days)} day(s) ago, past its ${interval} cadence`
						: `${name} is configured for triage and has never been swept`,
				}
			}
			return null
		},
	},
	{
		name: 'checks-red',
		invoke: '/thiamine:branch-to-pr',
		needs: ['gh'],
		detect: ({ cwd }) => {
			const out = capture('gh', ['pr', 'status', '--json', 'number,statusCheckRollup'], cwd)
			const pr = out ? JSON.parse(out).currentBranch : null
			if (!pr) return null

			const failed = (pr.statusCheckRollup ?? []).filter(
				(c) => c.conclusion === 'FAILURE' || c.state === 'FAILURE',
			)
			if (failed.length === 0) return null
			return {
				key: `${pr.number}:${failed.length}`,
				says: `#${pr.number} has ${failed.length} failing check(s)`,
			}
		},
	},
	{
		name: 'changes-requested',
		invoke: '/thiamine:branch-to-pr',
		needs: ['gh'],
		detect: ({ cwd }) => {
			const out = capture('gh', ['pr', 'status', '--json', 'number,reviewDecision'], cwd)
			const pr = out ? JSON.parse(out).currentBranch : null
			if (!pr || pr.reviewDecision !== 'CHANGES_REQUESTED') return null
			return {
				key: `${pr.number}:changes-requested`,
				says: `#${pr.number} has changes requested and nothing has answered them`,
			}
		},
	},
]

const envKey = (name) => `THIAMINE_SIGNAL_${name.replaceAll('-', '_').toUpperCase()}`

/** The first signal that fires, or null. Skips anything switched off, unavailable, or cooling down. */
export function firstSignal(ctx, fired = {}) {
	if (process.env.THIAMINE_SIGNALS === '0') return null

	const cooldown =
		Number(process.env.THIAMINE_SIGNAL_COOLDOWN_HOURS || DEFAULT_COOLDOWN_HOURS) * 3_600_000

	for (const signal of SIGNALS) {
		if (process.env[envKey(signal.name)] === '0') continue
		if ((signal.needs ?? []).some((tool) => !hasTool(tool))) continue

		let hit = null
		try {
			hit = signal.detect(ctx)
		} catch {
			continue
		}
		if (!hit) continue

		const last = fired[signal.name]
		if (last && last.key === hit.key && Date.now() - last.firedAtMs < cooldown) continue

		return { ...hit, name: signal.name, invoke: signal.invoke }
	}
	return null
}
