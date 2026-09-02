#!/usr/bin/env node
/**
 * SessionStart hook. Suggests at most one thiamine pass or state signal.
 *
 * Claude Code puts a SessionStart hook's stdout into context, so this prints one short
 * line and only when every threshold is met. It suggests. It never runs a pass, never
 * writes anything the pass owns, and never says the word mandatory.
 *
 * One line even when several are due. Two suggestions at startup is one more than anybody
 * acts on, and the second teaches the reader to skip the first.
 *
 * Two things compete for that one line, and a signal wins. A pass is bookkeeping measured in
 * turns, and it will still be true tomorrow. A signal is a condition in the repo right now,
 * and it names the skill that answers it. The cooldown in `signals.mjs` is what
 * stops a standing condition holding the line forever, so a pass still gets its turn.
 *
 * This is the only place a signal is allowed to speak. `stop-count-turns` stays silent
 * mid-session on purpose. A hook that talks during a task is why people stop reading hooks,
 * and that decision outranks the timeliness that speaking there would buy.
 */
import { blankState, PASSES, readState, readStdin, stateFile, writeState } from './nudge-state.mjs'
import { firstSignal } from './signals.mjs'

try {
	const event = readStdin()
	const projectDir = event.cwd || process.env.CLAUDE_PROJECT_DIR
	if (!projectDir) process.exit(0)

	const file = stateFile(projectDir)
	// A repo with no state file yet has run no turns, but its working tree can still be in a
	// state worth naming, so signals are checked before the pass gates rather than after.
	const state = readState(file) ?? blankState()

	const signal = firstSignal({ cwd: projectDir }, state.signals)
	if (signal) {
		state.signals[signal.name] = { key: signal.key, firedAtMs: Date.now() }
		writeState(file, state)
		process.stdout.write(
			`${signal.says}. Run ${signal.invoke} when the current task is done. Do not run it ` +
				`now, and do not mention this again this session.\n`,
		)
		process.exit(0)
	}

	// Nothing has been written since the last look, so there is nothing new to mine.
	if (state.transcriptMtimeMs === null) process.exit(0)

	// Each pass decides for itself what has to accumulate, so this only asks and ranks.
	const due = []
	for (const pass of PASSES) {
		const { turns, lastRunAtMs } = state.passes[pass.name]
		const minutesSince = lastRunAtMs > 0 ? (Date.now() - lastRunAtMs) / 60_000 : Infinity
		let hit = null
		try {
			hit = pass.due({ name: pass.name, turns, lastRunAtMs, minutesSince, cwd: projectDir })
		} catch {
			continue
		}
		if (hit) due.push({ pass, ...hit })
	}

	if (due.length === 0) process.exit(0)
	due.sort((a, b) => b.overdue - a.overdue)
	const { pass, says } = due[0]

	process.stdout.write(
		`${says}. Run ${pass.invoke} when the current task is done. Do not run it ` +
			`now, and do not mention this again this session.\n`,
	)
} catch {
	// Never break a session start over a suggestion.
}

process.exit(0)
