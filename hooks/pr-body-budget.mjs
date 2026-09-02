#!/usr/bin/env node
/**
 * PostToolUse hook. Counts the words in a PR body and says the number when it runs long.
 *
 * Length is the one writing standard an author cannot police, because the judgment that
 * wrote the sentence is the judgment that rereads it. A count is not a judgment. This warns
 * rather than denies, so the correction is a `gh pr edit` seconds after the PR opens.
 *
 * Fenced code blocks do not count. A pasted test run under ## Verification is evidence.
 *
 * It matches the invocation only in the command, never in a heredoc body. Prose that mentions
 * `gh pr edit` is prose, and counting the file it was written into reports a word count for a
 * pull request nobody touched.
 */
import fs from 'node:fs'
import path from 'node:path'
import { positiveInt } from './nudge-state.mjs'

const DEFAULT_MAX_WORDS = 250
/** `gh pr create|edit`, and the REST path a token without `read:org` scope has to use. */
const GH_PR_WRITE = /\bgh\s+pr\s+(?:create|edit)\b|\bgh\s+api\b[\s\S]*?\bpulls\/\d+\b/

/** The heredoc form an agent reaches for on a multi-line body: --body "$(cat <<'EOF' ... EOF)". */
function fromHeredoc(cmd) {
	const open = cmd.match(/<<-?\s*['"]?([A-Za-z_][A-Za-z0-9_]*)['"]?\r?\n/)
	if (!open) return null
	const start = open.index + open[0].length
	const end = cmd.slice(start).search(new RegExp(`^\\s*${open[1]}\\s*$`, 'm'))
	return end === -1 ? cmd.slice(start) : cmd.slice(start, start + end)
}

function fromBodyFile(cmd, cwd) {
	const m = cmd.match(/(?:--body-file|-F)[=\s]+(?:'([^']*)'|"([^"]*)"|(\S+))/)
	if (!m) return null
	const file = m[1] ?? m[2] ?? m[3]
	try {
		return fs.readFileSync(path.isAbsolute(file) ? file : path.join(cwd, file), 'utf8')
	} catch {
		return null
	}
}

function fromBodyFlag(cmd) {
	const m = cmd.match(/(?:--body|-b)[=\s]+(?:'([\s\S]*?)'|"([\s\S]*?)")/)
	return m ? (m[1] ?? m[2]) : null
}

const countWords = (body) =>
	body
		.replace(/^```[\s\S]*?^```/gm, '')
		.split(/\s+/)
		.filter(Boolean).length

try {
	const event = JSON.parse(fs.readFileSync(0, 'utf8'))
	if (event.tool_name !== 'Bash') process.exit(0)

	const cmd = event.tool_input?.command ?? ''
	const bodyStart = cmd.search(/<<-?\s*['"]?[A-Za-z_]/)
	const invocation = bodyStart === -1 ? cmd : cmd.slice(0, bodyStart)
	if (!GH_PR_WRITE.test(invocation)) process.exit(0)

	const body =
		fromHeredoc(cmd) ?? fromBodyFile(cmd, event.cwd || process.cwd()) ?? fromBodyFlag(cmd)
	if (!body) process.exit(0)

	const max = positiveInt(process.env.THIAMINE_PR_BODY_MAX_WORDS, DEFAULT_MAX_WORDS)
	const count = countWords(body)
	if (count <= max) process.exit(0)

	process.stdout.write(
		JSON.stringify({
			hookSpecificOutput: {
				hookEventName: 'PostToolUse',
				additionalContext:
					`This PR body is ${count} words against a ${max} word budget. Run the length step ` +
					`of branch-to-pr's opening-a-pr playbook over it and push the shorter version with ` +
					`\`gh pr edit --body-file\`. Cut whole sentences and sections, not adjectives.`,
			},
		}),
	)
} catch {
	// A hook that fails must not break the session.
}
process.exit(0)
