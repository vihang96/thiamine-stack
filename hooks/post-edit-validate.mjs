#!/usr/bin/env node
/**
 * PostToolUse hook. Runs the stack's own validator after an artifact in it is edited.
 *
 * The mechanical half of maintenance needs no pass and no approval. It is a fast script with
 * a deterministic answer, so it should run at the moment the defect is introduced
 * rather than wait for somebody to remember. An error found now costs one edit; the same
 * error found in a maintain-skills pass next month costs a reconstruction of why.
 *
 * Errors only. Warnings during authoring are normal and mostly transient: a scaffolded
 * skill is legitimately absent from the README until the author gets there, and a hook
 * that objects to every intermediate state gets turned off.
 *
 * It also runs after a Bash command that writes a file. A bash-first session writes with
 * `cat >` and `sed -i`, so matching the Edit tools alone let it edit the whole stack without
 * the validator running once.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { bashWrites } from './bash-target.mjs'

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
function findRoot(fromDir) {
	let dir = path.resolve(fromDir)
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

	// `Bash` in a matcher is an unanchored regex, so BashOutput and KillShell arrive here too,
	// and reporting errors "after this edit" when no edit happened is how a hook loses trust.
	if (!EDITS.has(event.tool_name) && event.tool_name !== 'Bash') done()

	let file = null
	if (EDITS.has(event.tool_name)) {
		file = event.tool_input?.file_path ?? null
	} else if (event.tool_name === 'Bash') {
		const { writes, paths } = bashWrites(event.tool_input?.command ?? '')
		if (!writes) done()
		file = paths[0] ?? null
	}
	if (!file && !event.cwd) done()

	// A write with no extractable path, such as a heredoc into python, belongs to the session's
	// own directory. The validator takes no arguments, so the repo is all it needs.
	const resolved = file ? path.resolve(event.cwd ?? '.', file) : null
	const root = findRoot(resolved ? path.dirname(resolved) : event.cwd)
	if (!root) done()

	// A write with no path has nothing to filter on, and the run is cheap enough to take anyway.
	if (resolved) {
		const rel = path.relative(root, resolved)
		const watched = rel === 'README.md' || WATCHED.includes(rel.split(path.sep)[0])
		if (!watched) done()
	}

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
