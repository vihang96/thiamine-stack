#!/usr/bin/env node
/**
 * Record that a thiamine pass just ran, so the session-start nudge stops suggesting it.
 *
 *   node scripts/mark-pass-run.mjs reflect
 *
 * Whoever runs a pass resets it. A nudge nobody can silence is a nudge people disable.
 * Exits quietly when the hooks are not installed, since the state file is theirs.
 */
import fs from 'node:fs'
import { PASSES, blankState, readState, stateFile, writeState } from '../hooks/nudge-state.mjs'

const name = process.argv[2]
const known = PASSES.map((p) => p.name)

if (!known.includes(name)) {
	console.error(`usage: node scripts/mark-pass-run.mjs <${known.join('|')}>`)
	process.exit(1)
}

const file = stateFile(process.cwd())
if (!fs.existsSync(file)) {
	console.log(`no nudge state at ${file}; hooks are not installed, nothing to reset`)
	process.exit(0)
}

const state = readState(file) ?? blankState()
state.passes[name] = { turns: 0, lastRunAtMs: Date.now() }
writeState(file, state)
console.log(`marked ${name} as run`)
