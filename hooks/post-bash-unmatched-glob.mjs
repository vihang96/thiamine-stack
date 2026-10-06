#!/usr/bin/env node
/**
 * PostToolUse hook. Says so when zsh refused to run a command over an unmatched glob.
 *
 * zsh's `nomatch` option aborts a command whose glob matches no file, before the command
 * starts. `grep -rn x src --include=*.ts` never runs grep. In a chain the other commands still
 * print and the call exits 0, so the missing output reads as "no match" and becomes a claim
 * that nothing references the symbol. `2>/dev/null` on that command does not hide the error,
 * which is the one trace it leaves.
 */
import fs from 'node:fs'

const UNMATCHED = /(?:\(eval\)|\bzsh):\d+: no matches found: (\S+)/g

const textOf = (response) =>
	typeof response === 'string'
		? response
		: [response?.stdout, response?.stderr, response?.output].filter(Boolean).join('\n')

try {
	const event = JSON.parse(fs.readFileSync(0, 'utf8'))
	if (event.tool_name !== 'Bash') process.exit(0)

	const globs = [...new Set([...textOf(event.tool_response).matchAll(UNMATCHED)].map((m) => m[1]))]
	if (globs.length === 0) process.exit(0)

	const named = globs.map((g) => `\`${g}\``).join(', ')
	process.stdout.write(
		JSON.stringify({
			hookSpecificOutput: {
				hookEventName: 'PostToolUse',
				additionalContext:
					`zsh matched no file for ${named}, so the command holding it never ran. Its ` +
					`missing output is not a search result. If the glob is a pattern for the ` +
					`command (\`--include\`, \`-name\`, a path inside a package), quote it and rerun ` +
					`before concluding anything from that command.`,
			},
		}),
	)
} catch {
	// A hook that fails must not break the session.
}
process.exit(0)
