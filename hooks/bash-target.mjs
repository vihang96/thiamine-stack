/**
 * Does this Bash command write a file, and where.
 *
 * The guards beside this file matched `Edit|Write|MultiEdit|NotebookEdit` only, so an agent
 * writing through `cat > file <<EOF`, `tee`, or `sed -i` passed both of them untouched. That
 * is not an exotic path: it is what a bash-first session does for every edit it makes.
 *
 * Two answers, because the callers need different things. `writes` decides whether anything
 * was written at all. `paths` is best effort, for the caller that wants precision, and it is
 * legitimately empty for a heredoc into an interpreter, where the target only exists inside
 * the script text. A caller with no path falls back to the session's cwd.
 *
 * What it does not catch, deliberately: a path built from a variable, a write inside a
 * process substitution, and anything an interpreter does that does not look like a write.
 * The cost of a miss is one unguarded edit. The cost of over-reaching is a guard that denies
 * a read-only command, which is how a guard gets turned off.
 */

/** `> f`, `>> f`. A digit or `&` in front is a descriptor dup (`2>&1`, `>&2`), not a file. */
const REDIRECT = /(?<![0-9&])>>?\s*(?!&)(?:'([^']+)'|"([^"]+)"|([^\s'">|&;()]+))/g

/** `tee f`, `tee -a f`. Flags other than -a are rare enough to leave to the cwd fallback. */
const TEE = /\btee\s+(?:-a\s+)?(?:'([^']+)'|"([^"]+)"|([^\s'"|&;()-][^\s'"|&;()]*))/g

/** In-place edits name their file last, after the script. */
const SED_IN_PLACE = /\bsed\b[^|;&]*?\s-i[^|;&]*?\s(?:'([^']+)'|"([^"]+)"|([^\s'"|&;()]+))\s*$/gm

/** A heredoc into an interpreter. The written path is inside the body, not in the command. */
const INTERPRETER_HEREDOC = /\b(?:python3?|node|ruby|perl|php|sh|bash|zsh)\b[^|;&\n]*<<-?\s*['"]?(\w+)/

/** Write-ish tokens in a heredoc body. Without one, treat the script as read-only. */
const BODY_WRITES = /\bopen\s*\([^)]*['"][wax]|writeFileSync|appendFileSync|\.write\(|Path\([^)]*\)\.write|>\s*['"]?[\w./-]+/

/** Discard the targets that are not files anyone guards: /dev/null, /dev/stderr, and friends. */
const isRealTarget = (p) => Boolean(p) && !p.startsWith('/dev/') && !p.startsWith('$')

function bodyOf(cmd, delimiter) {
	const open = cmd.match(new RegExp(`<<-?\\s*['"]?${delimiter}['"]?\\r?\\n`))
	if (!open) return ''
	const start = open.index + open[0].length
	const end = cmd.slice(start).search(new RegExp(`^\\s*${delimiter}\\s*$`, 'm'))
	return end === -1 ? cmd.slice(start) : cmd.slice(start, start + end)
}

/**
 * Strip heredoc bodies before scanning for redirects. A body is data, and prose inside one
 * routinely contains `>` or a path. Scanning it is how a guard reports on a file that was
 * only ever mentioned.
 */
export function withoutHeredocBodies(cmd) {
	let out = ''
	let rest = cmd
	for (;;) {
		const open = rest.match(/<<-?\s*['"]?(\w+)['"]?\r?\n/)
		if (!open) return out + rest
		const start = open.index + open[0].length
		out += rest.slice(0, start)
		const body = rest.slice(start)
		const end = body.search(new RegExp(`^\\s*${open[1]}\\s*$`, 'm'))
		if (end === -1) return out
		rest = body.slice(end)
	}
}

export function bashWrites(cmd) {
	if (!cmd) return { writes: false, paths: [] }

	const code = withoutHeredocBodies(cmd)
	const paths = []
	for (const re of [REDIRECT, TEE, SED_IN_PLACE]) {
		for (const m of code.matchAll(re)) {
			const target = m[1] ?? m[2] ?? m[3]
			if (isRealTarget(target)) paths.push(target)
		}
	}

	const heredoc = code.match(INTERPRETER_HEREDOC)
	const scriptWrites = heredoc ? BODY_WRITES.test(bodyOf(cmd, heredoc[1])) : false

	return { writes: paths.length > 0 || scriptWrites, paths: [...new Set(paths)] }
}
