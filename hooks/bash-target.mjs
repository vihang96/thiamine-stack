import path from 'node:path'

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
 * What it does not catch, deliberately: a path built from a variable the command did not
 * set itself, a write inside a process substitution, and anything an interpreter does that
 * does not look like a write.
 * The cost of a miss is one unguarded edit. The cost of over-reaching is a guard that denies
 * a read-only command, which is how a guard gets turned off.
 */

/** `> f`, `>> f`. A digit or `&` in front is a descriptor dup (`2>&1`, `>&2`), not a file. */
const REDIRECT = /(?<![0-9&])>>?\s*(?!&)(?:'([^']+)'|"([^"]+)"|([^\s'">|&;()]+))/y

const blankQuoted = (cmd) =>
	cmd.replace(/'[^']*'|"(?:[^"\\]|\\.)*"/g, (span) => ' '.repeat(span.length))

/** `tee f`, `tee -a f`. Flags other than -a are rare enough to leave to the cwd fallback. */
const TEE = /\btee\s+(?:-a\s+)?(?:'([^']+)'|"([^"]+)"|([^\s'"|&;()-][^\s'"|&;()]*))/g

/** In-place edits name their file last, after the script. */
const SED_IN_PLACE = /\bsed\b[^|;&]*?\s-i[^|;&]*?\s(?:'([^']+)'|"([^"]+)"|([^\s'"|&;()]+))\s*$/gm

/**
 * A heredoc into an interpreter. The written path is inside the body, not in the command.
 * Not after a dot or a dash, or `cat > check.sh <<EOF` reads as a heredoc into `sh`.
 */
const INTERPRETER_HEREDOC =
	/(?<![.-])\b(?:python3?|node|ruby|perl|php|sh|bash|zsh)\b[^|;&\n]*<<-?\s*['"]?(\w+)/

/** Without one of these in its body, a script is treated as read-only. */
const BODY_WRITES =
	/\bopen\s*\([^)]*['"][wax]|writeFileSync|appendFileSync|\.write\(|Path\([^)]*\)\.write|>\s*['"]?[\w./-]+/

/** /dev/null and an unexpanded variable are not files a guard has anything to say about. */
const isRealTarget = (p) => Boolean(p) && !p.startsWith('/dev/') && !p.startsWith('$')

/** `S=/tmp/x;` or `S=/tmp/x &&` on its own, not `S=x cmd`, which scopes it to one command. */
const ASSIGNMENT =
	/(?:^|[;&|\n])\s*([A-Za-z_]\w*)=(?:'([^']*)'|"([^"$`]*)"|([^\s;&|'"$`]+))(?=\s*(?:&&|;|\n|$))/g

/** Variables the command sets for itself, so `cat > $S/f` can name the file it writes. */
function assignments(code) {
	const vars = new Map()
	for (const m of code.matchAll(ASSIGNMENT)) vars.set(m[1], m[2] ?? m[3] ?? m[4])
	return vars
}

/** A leading `$NAME` or `${NAME}` the command set itself. Anything else stays unexpanded. */
const expand = (p, vars) =>
	p?.replace(/^\$\{?(\w+)\}?/, (whole, name) => (vars.has(name) ? vars.get(name) : whole))

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

/**
 * The directory a command has moved into by the time it writes: every `cd dir &&` or
 * `cd dir;` in the command, not only a leading one, joined in order. Relative write targets
 * resolve against it, not against the session's cwd, or a write after
 * `git worktree add tree/x && cd tree/x` is reported against the main checkout. A `cd` to a
 * variable the command did not set leaves the directory unknown.
 */
export function writeDir(cmd) {
	const { code } = splitHeredocs(cmd ?? '')
	const vars = assignments(code)
	let dir = null
	const CD = /(?:^|&&|;|\n)\s*cd\s+(?:'([^']+)'|"([^"]+)"|([^\s;&|'"]+))\s*(?=&&|;|\n)/g
	for (const m of code.matchAll(CD)) {
		const next = expand(m[1] ?? m[2] ?? m[3], vars)
		if (next.startsWith('$')) return null
		dir = dir && !/^[/~]/.test(next) ? path.join(dir, next) : next
	}
	return dir
}

export function bashWrites(cmd) {
	if (!cmd) return { writes: false, paths: [] }

	const { code, bodies } = splitHeredocs(cmd)
	const vars = assignments(code)
	const paths = []
	for (const m of blankQuoted(code).matchAll(/(?<![0-9&])>>?(?!&)/g)) {
		REDIRECT.lastIndex = m.index
		const hit = REDIRECT.exec(code)
		const target = expand(hit && (hit[1] ?? hit[2] ?? hit[3]), vars)
		if (isRealTarget(target)) paths.push(target)
	}
	for (const re of [TEE, SED_IN_PLACE]) {
		for (const m of code.matchAll(re)) {
			const target = expand(m[1] ?? m[2] ?? m[3], vars)
			if (isRealTarget(target)) paths.push(target)
		}
	}

	const heredoc = code.match(INTERPRETER_HEREDOC)
	const scriptWrites = heredoc ? BODY_WRITES.test(bodies.get(heredoc[1]) ?? '') : false

	return { writes: paths.length > 0 || scriptWrites, paths: [...new Set(paths)] }
}
