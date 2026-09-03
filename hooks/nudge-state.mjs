/**
 * Shared state for the thiamine pass nudges, and the primitives the nudges are built from.
 *
 * One file for every pass, and one suggestion per session at most. Separate nudges
 * competing at session start is how all of them end up ignored.
 *
 * The state lives under the harness's own project directory rather than in the user's
 * repo, because it is bookkeeping about sessions rather than a deliverable.
 *
 * It also records which state signals have already spoken, and for which condition, so an
 * ignored nudge does not become a nag. `signals.mjs` owns what those conditions are.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** Milliseconds any one probe may spend. A session start that waits is worse than a quiet one. */
const PROBE_TIMEOUT = 2500

/** Trimmed stdout, or null: a probe must never be the reason a session start fails. */
export function capture(cmd, args, cwd) {
	try {
		return execFileSync(cmd, args, {
			cwd,
			encoding: 'utf8',
			timeout: PROBE_TIMEOUT,
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim()
	} catch {
		return null
	}
}

const tools = new Map()

/** Cached, because a session start asks about the same executable twice. */
export function hasTool(name) {
	if (!tools.has(name))
		tools.set(name, capture('sh', ['-c', `command -v ${name}`], process.cwd()) !== null)
	return tools.get(name)
}

/** One pass's bar, overridable with THIAMINE_<NAME>_<MEASURE>, hyphens as underscores. */
const bar = (name, measure, fallback) => {
	const key = `THIAMINE_${name.replaceAll('-', '_').toUpperCase()}_${measure}`
	return positiveInt(process.env[key], fallback)
}

/** The default measure: turns of transcript, and enough wall-clock that a pass cannot repeat. */
const byTurns =
	(minTurns, minMinutes, says) =>
	({ name, turns, minutesSince }) => {
		const wantTurns = bar(name, 'MIN_TURNS', minTurns)
		const wantMinutes = bar(name, 'MIN_MINUTES', minMinutes)
		if (turns < wantTurns || minutesSince < wantMinutes) return null
		// Rank by how far past its own bar a pass is, so the more neglected one wins rather
		// than whichever happens to be first in the list.
		return { says: says(turns), overdue: turns / wantTurns }
	}

/**
 * A pass runs when enough has accumulated behind it, and `due` decides what accumulates.
 *
 * For the mining passes it is turns of transcript, gated on elapsed time as well, because
 * turns alone fires on a busy afternoon and time alone fires on a week of doing nothing else.
 * For an audit of what the code now does it is commits, since a repo nobody has changed has
 * no drift to find however many turns went past.
 *
 * reflect sits far higher than continual-learning on purpose. Memory takes a fact the
 * moment it is stated, so it is worth mining often. A method is not proven until a body of
 * work has landed, and a reflect pass over half a feature finds coincidences.
 *
 * `invoke` carries the `thiamine:` prefix because these hooks only ever run from the
 * installed Claude Code plugin, where that is the skill's real name. The bare name does not
 * resolve there, and a suggestion naming a command that does not exist is worse than none.
 *
 * Adding a pass is one entry, and nothing else changes.
 */
export const PASSES = [
	{
		name: 'continual-learning',
		invoke: '/thiamine:continual-learning',
		due: byTurns(10, 120, (t) => `${t} turns of transcript have not been mined for durable memory`),
	},
	{
		name: 'reflect',
		invoke: '/thiamine:reflect',
		due: byTurns(
			40,
			720,
			(t) => `${t} turns of work have landed without being reflected into skills`,
		),
	},
	{
		name: 'capture-preferences',
		invoke: '/thiamine:capture-preferences',
		// No mechanical signal says a correction about *how* to work has recurred, so this is a
		// prompt to look after a body of work, not evidence that something is due. Hence the
		// high bar: a fortnight of elapsed time as well as the turns.
		due: byTurns(60, 20_160, (t) => `${t} turns have gone by without capturing how you work`),
	},
	{
		name: 'maintain-skills',
		invoke: '/thiamine:maintain-skills',
		due: ({ name, cwd, lastRunAtMs, minutesSince }) => {
			// The elapsed-time gate is free, and everything below it costs a subprocess.
			if (minutesSince < bar(name, 'MIN_MINUTES', 4320)) return null

			// A repo with no agent-facing context has nothing to audit, so this pass is absent
			// there rather than firing on every commit.
			const root = capture('git', ['rev-parse', '--show-toplevel'], cwd)
			if (!root) return null
			const agentFacing = ['CLAUDE.md', 'AGENTS.md', 'skills', 'rules']
			if (!agentFacing.some((f) => fs.existsSync(path.join(root, f)))) return null

			const since = lastRunAtMs > 0 ? [`--since=${new Date(lastRunAtMs).toISOString()}`] : []
			const landed = positiveInt(capture('git', ['rev-list', '--count', 'HEAD', ...since], cwd), 0)
			const wantCommits = bar(name, 'MIN_COMMITS', 15)
			if (landed < wantCommits) return null

			const window = lastRunAtMs > 0 ? 'since the last pass' : 'and no pass has ever run here'
			return {
				says: `${landed} commits have landed ${window}, so what agents are told may not match the code`,
				overdue: landed / wantCommits,
			}
		},
	},
]

/** Claude Code names a project directory after its absolute path, with slashes as dashes. */
export function stateFile(projectDir) {
	const slug = projectDir.replaceAll('/', '-')
	return path.join(os.homedir(), '.claude', 'projects', slug, '.thiamine-nudge.json')
}

export function blankState() {
	const passes = {}
	for (const p of PASSES) passes[p.name] = { turns: 0, lastRunAtMs: 0 }
	return { version: 3, transcriptMtimeMs: null, passes, signals: {} }
}

export function readState(file) {
	try {
		const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
		// Migrating a version 2 file beats discarding it: throwing it away resets the turn
		// counters, and the next session start suggests a pass that just ran.
		if (parsed.version === 2) parsed.version = 3
		if (parsed.version !== 3) return null
		// A pass or a field added after this file was written starts from zero rather than crashing.
		for (const p of PASSES) parsed.passes[p.name] ??= { turns: 0, lastRunAtMs: 0 }
		parsed.signals ??= {}
		return parsed
	} catch {
		return null
	}
}

export function writeState(file, state) {
	fs.mkdirSync(path.dirname(file), { recursive: true })
	fs.writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`)
}

export function positiveInt(value, fallback) {
	const parsed = Number.parseInt(value ?? '', 10)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function readStdin() {
	try {
		return JSON.parse(fs.readFileSync(0, 'utf8'))
	} catch {
		return {}
	}
}
