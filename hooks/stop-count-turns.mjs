#!/usr/bin/env node
/**
 * Stop hook. Counts completed turns and tracks transcript movement. Nothing else.
 *
 * This hook never blocks and never speaks. Mining transcripts mid-session would
 * interrupt work to do bookkeeping, so the suggestion is deferred to the next
 * SessionStart. A hook that talks during a task is the reason people stop reading hooks.
 */
import fs from 'node:fs'
import {
	blankState,
	readState,
	readStdin,
	stateFile,
	writeState,
} from './continual-learning-state.mjs'

const quiet = () => {
	process.stdout.write('{}')
	process.exit(0)
}

try {
	const event = readStdin()

	// Claude Code documents this: while stop_hook_active is true a Stop hook is already
	// in a continuation loop, so return success immediately and add nothing.
	if (event.stop_hook_active) quiet()

	const projectDir = event.cwd || process.env.CLAUDE_PROJECT_DIR
	if (!projectDir) quiet()

	const file = stateFile(projectDir)
	const state = readState(file) ?? blankState()

	let mtime = null
	if (event.transcript_path) {
		try {
			mtime = fs.statSync(event.transcript_path).mtimeMs
		} catch {
			mtime = null
		}
	}

	state.turnsSinceLastRun += 1
	if (mtime !== null) state.lastTranscriptMtimeMs = mtime
	writeState(file, state)
} catch {
	// A hook that fails must not break the session. Swallow and stay silent.
}

quiet()
