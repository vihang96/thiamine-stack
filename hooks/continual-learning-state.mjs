/**
 * Shared state for the continual-learning nudge.
 *
 * The state lives beside the memory store it describes, so a project's memory and the
 * bookkeeping about it travel together and neither lands in the user's repo.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const DEFAULT_MIN_TURNS = 10
export const DEFAULT_MIN_MINUTES = 120

/** Claude Code names a project directory after its absolute path, with slashes as dashes. */
export function stateFile(projectDir) {
	const slug = projectDir.replaceAll('/', '-')
	return path.join(os.homedir(), '.claude', 'projects', slug, 'memory', '.continual-learning.json')
}

export function readState(file) {
	try {
		const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
		if (parsed.version !== 1) return null
		return parsed
	} catch {
		return null
	}
}

export function blankState() {
	return { version: 1, lastRunAtMs: 0, turnsSinceLastRun: 0, lastTranscriptMtimeMs: null }
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
