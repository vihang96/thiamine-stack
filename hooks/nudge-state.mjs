/**
 * Shared state for the thiamine pass nudges.
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
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * A pass is suggested once it has both enough turns and enough elapsed time behind it.
 * Turns alone fires on a busy afternoon; time alone fires on a week of doing nothing else.
 *
 * reflect sits far higher than continual-learning on purpose. Memory takes a fact the
 * moment it is stated, so it is worth mining often. A method is not proven until a body of
 * work has landed, and a reflect pass over half a feature finds coincidences.
 *
 * `invoke` carries the `thiamine:` prefix because these hooks only ever run from the
 * installed Claude Code plugin, where that is the skill's real name. The bare name does not
 * resolve there, and a suggestion naming a command that does not exist is worse than none.
 */
export const PASSES = [
	{
		name: 'continual-learning',
		invoke: '/thiamine:continual-learning',
		minTurns: 10,
		minMinutes: 120,
		says: (turns) => `${turns} turns of transcript have not been mined for durable memory`,
	},
	{
		name: 'reflect',
		invoke: '/thiamine:reflect',
		minTurns: 40,
		minMinutes: 720,
		says: (turns) => `${turns} turns of work have landed without being reflected into skills`,
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
		// Version 2 held no signals. Migrating beats discarding: throwing the file away resets
		// the turn counters, and the next session start suggests a pass that just ran.
		if (parsed.version === 2) {
			parsed.version = 3
			parsed.signals = {}
		}
		if (parsed.version !== 3) return null
		// A pass added after this file was written starts from zero rather than crashing.
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
