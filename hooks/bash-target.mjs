/**
 * Does this Bash command write a file, and where.
 *
 * The guards beside this file matched `Edit|Write|MultiEdit|NotebookEdit` only, so an agent
 * writing through `cat > file <<EOF`, `tee`, or `sed -i` passed both of them untouched. That
 * is not an exotic path. It is what a bash-first session does for every edit it makes.
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

/** Without one of these in its body, a script is treated as read-only. */
const BODY_WRITES = /\bopen\s*\([^)]*['"][wax]|writeFileSync|appendFileSync|\.write\(|Path\([^)]*\)\.write|>\s*['"]?[\w./-]+/

/** /dev/null and an unexpanded variable are not files a guard has anything to say about. */
const isRealTarget = (p) => Boolean(p) && !p.startsWith('/dev/') && !p.startsWith('$')

/**
 * The code around the heredoc bodies, and the bodies by delimiter. Only the code is scanned
 * for redirects: a body is data, and prose inside one routinely contains `>` or a path, so
 * scanning it is how a guard reports on a file that was only ever mentioned.
 */
function splitHeredocs(cmd) {
	const bodies = new Map()
	let code = ''
	let rest = cmd
	for (;;) {
		const open = rest.match(/<<-?\s*['"]?(\w+)['"]?\r?\n/)
		if (!open) return { code: code + rest, bodies }
		const start = open.index + open[0].length
		code += rest.slice(0, start)
		const after = rest.slice(start)
		const end = after.search(new RegExp(`^\\s*${open[1]}\\s*$`, 'm'))
		if (!bodies.has(open[1])) bodies.set(open[1], end === -1 ? after : after.slice(0, end))
		if (end === -1) return { code, bodies }
		rest = after.slice(end)
	}
}

export function bashWrites(cmd) {
	if (!cmd) return { writes: false, paths: [] }

	const { code, bodies } = splitHeredocs(cmd)
	const paths = []
	for (const re of [REDIRECT, TEE, SED_IN_PLACE]) {
		for (const m of code.matchAll(re)) {
			const target = m[1] ?? m[2] ?? m[3]
			if (isRealTarget(target)) paths.push(target)
		}
	}

	const heredoc = code.match(INTERPRETER_HEREDOC)
	const scriptWrites = heredoc ? BODY_WRITES.test(bodies.get(heredoc[1]) ?? '') : false

	return { writes: paths.length > 0 || scriptWrites, paths: [...new Set(paths)] }
}
