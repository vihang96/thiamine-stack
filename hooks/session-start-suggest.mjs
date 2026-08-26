#!/usr/bin/env node
/**
 * SessionStart hook. Suggests at most one thiamine pass, once enough has accumulated.
 *
 * Claude Code puts a SessionStart hook's stdout into context, so this prints one short
 * line and only when every threshold is met. It suggests. It never runs a pass, never
 * writes anything the pass owns, and never says the word mandatory.
 *
 * One line even when several passes are due. Two suggestions at startup is one more than
 * anybody acts on, and the second teaches the reader to skip the first.
 */
import { PASSES, positiveInt, readState, readStdin, stateFile } from './nudge-state.mjs'

const envKey = (name, suffix) => `THIAMINE_${name.replaceAll('-', '_').toUpperCase()}_${suffix}`

try {
	const event = readStdin()
	const projectDir = event.cwd || process.env.CLAUDE_PROJECT_DIR
	if (!projectDir) process.exit(0)

	const state = readState(stateFile(projectDir))
	if (!state) process.exit(0)

	// Nothing has been written since the last look, so there is nothing new to mine.
	if (state.transcriptMtimeMs === null) process.exit(0)

	const due = []
	for (const pass of PASSES) {
		const { turns, lastRunAtMs } = state.passes[pass.name]
		const minTurns = positiveInt(process.env[envKey(pass.name, 'MIN_TURNS')], pass.minTurns)
		const minMinutes = positiveInt(process.env[envKey(pass.name, 'MIN_MINUTES')], pass.minMinutes)
		const minutesSince = lastRunAtMs > 0 ? (Date.now() - lastRunAtMs) / 60_000 : Infinity

		if (turns >= minTurns && minutesSince >= minMinutes) {
			// Rank by how far past its own bar a pass is, so the more neglected one wins
			// rather than whichever happens to be first in the list.
			due.push({ pass, turns, overdue: turns / minTurns })
		}
	}

	if (due.length === 0) process.exit(0)
	due.sort((a, b) => b.overdue - a.overdue)
	const { pass, turns } = due[0]

	process.stdout.write(
		`${pass.says(turns)}. Run ${pass.invoke} when the current task is done. Do not run it ` +
			`now, and do not mention this again this session.\n`,
	)
} catch {
	// Never break a session start over a suggestion.
}

process.exit(0)
