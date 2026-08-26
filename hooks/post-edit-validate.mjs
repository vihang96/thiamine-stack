#!/usr/bin/env node
/**
 * PostToolUse hook. Runs the stack's own validator after an artifact in it is edited.
 *
 * The mechanical half of maintenance needs no pass and no approval. It is a 30ms script
 * with a deterministic answer, so it should run at the moment the defect is introduced
 * rather than wait for somebody to remember. An error found now costs one edit; the same
 * error found in a maintain-skills pass next month costs a reconstruction of why.
 *
 * Errors only. Warnings during authoring are normal and mostly transient: a scaffolded
 * skill is legitimately absent from the README until the author gets there, and a hook
 * that objects to every intermediate state gets turned off.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const EDITS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const WATCHED = ['skills', 'rules', 'agents', 'commands', 'templates', 'hooks', 'scripts']

const done = (context) => {
	if (context) {
		process.stdout.write(
			JSON.stringify({
				hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: context },
			}),
		)
	}
	process.exit(0)
}

/**
 * Walk up for a thiamine checkout. Both markers are required: plenty of repos have a
 * scripts/ directory, and this hook is installed globally so it sees all of them.
 */
function findRoot(from) {
	let dir = path.dirname(path.resolve(from))
	for (let i = 0; i < 12; i++) {
		if (
			fs.existsSync(path.join(dir, 'scripts', 'validate.mjs')) &&
			fs.existsSync(path.join(dir, 'rules', 'RULES.md'))
		)
			return dir
		const parent = path.dirname(dir)
		if (parent === dir) break
		dir = parent
	}
	return null
}

try {
	const event = JSON.parse(fs.readFileSync(0, 'utf8'))
	if (!EDITS.has(event.tool_name)) done()

	const file = event.tool_input?.file_path
	if (!file) done()

	const root = findRoot(file)
	if (!root) done()

	const rel = path.relative(root, path.resolve(file))
	const watched = rel === 'README.md' || WATCHED.includes(rel.split(path.sep)[0])
	if (!watched) done()

	let out = ''
	try {
		out = execFileSync('node', ['scripts/validate.mjs'], {
			cwd: root,
			encoding: 'utf8',
			timeout: 15_000,
		})
	} catch (e) {
		// Exit 1 just means errors were found, and its stdout is the report.
		out = e.stdout ?? ''
	}

	// An ERROR is its header line plus the indented lines under it.
	const errors = []
	let capturing = false
	for (const line of out.split('\n')) {
		if (line.startsWith('ERROR')) {
			capturing = true
			errors.push(line)
		} else if (capturing && line.startsWith('    ')) {
			errors.push(line)
		} else {
			capturing = false
		}
	}

	if (errors.length === 0) done()
	done(
		`thiamine validate.mjs reports errors after this edit. Fix them before moving on.\n\n${errors.join('\n')}`,
	)
} catch {
	// A hook that fails must not break the session.
	process.exit(0)
}
