#!/usr/bin/env node
/**
 * SessionStart hook. Suggests the continual-learning loop once enough has accumulated.
 *
 * Claude Code puts a SessionStart hook's stdout into context, so this prints one short
 * line and only when every threshold is met. It suggests. It never runs the loop, never
 * writes memory, and never says the word mandatory.
 */
import {
	DEFAULT_MIN_MINUTES,
	DEFAULT_MIN_TURNS,
	positiveInt,
	readState,
	readStdin,
	stateFile,
} from './continual-learning-state.mjs'

try {
	const event = readStdin()
	const projectDir = event.cwd || process.env.CLAUDE_PROJECT_DIR
	if (!projectDir) process.exit(0)

	const state = readState(stateFile(projectDir))
	if (!state) process.exit(0)

	const minTurns = positiveInt(process.env.THIAMINE_CL_MIN_TURNS, DEFAULT_MIN_TURNS)
	const minMinutes = positiveInt(process.env.THIAMINE_CL_MIN_MINUTES, DEFAULT_MIN_MINUTES)

	const minutesSince =
		state.lastRunAtMs > 0 ? Math.floor((Date.now() - state.lastRunAtMs) / 60_000) : Infinity

	const enoughTurns = state.turnsSinceLastRun >= minTurns
	const enoughTime = minutesSince >= minMinutes
	const transcriptMoved = state.lastTranscriptMtimeMs !== null

	if (!(enoughTurns && enoughTime && transcriptMoved)) process.exit(0)

	process.stdout.write(
		`${state.turnsSinceLastRun} turns of transcript have not been mined for durable ` +
			`memory. Run /continual-learning when the current task is done. Do not run it now, ` +
			`and do not mention this again this session.\n`,
	)
} catch {
	// Never break a session start over a suggestion.
}

process.exit(0)
