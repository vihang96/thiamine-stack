#!/usr/bin/env node
/**
 * Audit a run's attempts log for what should be pruned and what was quietly overridden.
 *
 *   node prune.mjs <run-dir>
 *
 * Reads <run-dir>/metrics.tsv and <run-dir>/attempts.tsv. Read-only, and it decides nothing:
 * every finding is something for the run's owner to act on or to override deliberately.
 *
 * This exists because pruning is arithmetic and the parent is the worst available judge of
 * its own ideas. Not through bad faith, but because it authored them and has attempts sunk
 * into them. Counting reject streaks and comparing guard values against their floors is
 * exactly the kind of judgement that should not depend on the mood of whoever is reading a
 * forty-row log at 2am.
 *
 * metrics.tsv, tab separated, with a header:
 *   role      name          direction  threshold
 *   objective iou           higher     0.90
 *   guard     cost_per_doc  lower      0.004
 *
 * attempts.tsv, tab separated, with a header:
 *   id  category  prior  hypothesis  change  before  after  guards  verdict  note
 *   1   instruction  likely  state table extent first  prompt v2  0.781  0.812  cost_per_doc=0.0031  kept  held on re-measure
 *
 * `prior` is what you expected before running it: likely, unsure, or longshot. It is not
 * decoration. It is the only way to find out afterwards whether your predictions about this
 * system are worth anything, which is the question a would-be idea classifier assumes.
 */
import fs from 'node:fs'
import path from 'node:path'

// Three rejects from one category with nothing kept is the streak the playbook prunes on.
const STRIKES = 3
const PRIORS = ['likely', 'unsure', 'longshot']

const dir = process.argv[2]
if (!dir) {
	process.stderr.write('usage: node prune.mjs <run-dir>\n')
	process.exit(2)
}

const die = (msg) => {
	process.stderr.write(`error: ${msg}\n`)
	process.exit(2)
}

/** Tab separated with a header row. Blank lines and # comments skipped. */
function readTsv(file) {
	let text
	try {
		text = fs.readFileSync(file, 'utf8')
	} catch {
		die(`cannot read ${file}`)
	}
	const lines = text.split('\n').filter((l) => l.trim() !== '' && !l.startsWith('#'))
	if (lines.length < 2) die(`${path.basename(file)} has a header but no rows`)
	const cols = lines[0].split('\t').map((c) => c.trim())
	return lines.slice(1).map((line) => {
		const cells = line.split('\t')
		return Object.fromEntries(cols.map((c, i) => [c, (cells[i] ?? '').trim()]))
	})
}

const metrics = readTsv(path.join(dir, 'metrics.tsv'))
const attempts = readTsv(path.join(dir, 'attempts.tsv'))

const objective = metrics.find((m) => m.role === 'objective')
if (!objective) die('metrics.tsv declares no objective row')
const guards = metrics.filter((m) => m.role === 'guard')

/** Is a better than b, for a metric in this direction? Ties count as not worse. */
const better = (a, b, direction) => (direction === 'lower' ? a < b : a > b)
const worse = (a, b, direction) => better(b, a, direction)

const num = (s) => (s === '' || !Number.isFinite(Number(s)) ? null : Number(s))
const parseGuards = (cell) =>
	Object.fromEntries(
		cell
			.split(';')
			.filter(Boolean)
			.map((p) => {
				const [k, v] = p.split('=')
				return [k?.trim(), num(v ?? '')]
			})
			.filter(([k, v]) => k && v !== null),
	)

const out = []
const kept = attempts.filter((a) => a.verdict === 'kept')

// ---------------------------------------------------------------- categories
const byCategory = new Map()
for (const a of attempts) {
	const c = a.category || '(none)'
	if (!byCategory.has(c)) byCategory.set(c, { attempts: 0, kept: 0, reverted: 0, streak: [] })
	const e = byCategory.get(c)
	e.attempts++
	if (a.verdict === 'kept') {
		e.kept++
		e.streak = [] // a win resets it. The streak that matters is the current one.
	} else if (a.verdict === 'reverted') {
		e.reverted++
		e.streak.push(a.id)
	}
}

out.push('CATEGORIES')
const exhausted = []
for (const [name, e] of [...byCategory].sort((a, b) => b[1].attempts - a[1].attempts)) {
	const done = e.streak.length >= STRIKES
	if (done) exhausted.push({ name, ids: e.streak })
	out.push(
		`  ${name.padEnd(18)} ${String(e.attempts).padStart(2)} attempts, ${e.kept} kept, ` +
			`${e.reverted} reverted${done ? `   EXHAUSTED (${e.streak.length} rejected in a row: ${e.streak.join(',')})` : ''}`,
	)
}
if (!exhausted.length) out.push('  nothing has hit the strike limit')

// A run that only ever drew from one category found the best version of one idea.
if (byCategory.size === 1 && attempts.length >= STRIKES) {
	out.push(
		`  NARROW: all ${attempts.length} attempts came from one category. Take the next from another.`,
	)
}

// ---------------------------------------------------------------- guard breaches
out.push('', 'GUARDS ON ACCEPTED ATTEMPTS')
const breaches = []
for (const a of kept) {
	const values = parseGuards(a.guards)
	for (const g of guards) {
		const v = values[g.name]
		const floor = num(g.threshold)
		if (v === null || floor === null) continue
		if (worse(v, floor, g.direction)) breaches.push({ id: a.id, guard: g.name, v, floor })
	}
}
for (const b of breaches) {
	out.push(`  BREACH attempt ${b.id}: ${b.guard} = ${b.v}, floor ${b.floor}. Accepted anyway.`)
}
const unmeasured = guards
	.filter((g) => !kept.some((a) => parseGuards(a.guards)[g.name] !== undefined))
	.map((g) => g.name)
if (unmeasured.length) {
	out.push(`  NEVER MEASURED on any accepted attempt: ${unmeasured.join(', ')}`)
}
if (!breaches.length && !unmeasured.length)
	out.push('  every accepted attempt is inside its floors')

// ---------------------------------------------------------------- banked regressions
// Accepted attempts are sequential, so a later one should not be worse than an earlier one
// on the objective. When it is, either a regression was banked or two parallel variants are
// both still live and one of them is dominated.
out.push('', 'ACCEPTED PROGRESSION')
const withAfter = kept
	.map((a) => ({ id: a.id, after: num(a.after) }))
	.filter((a) => a.after !== null)
const regressions = []
for (let i = 1; i < withAfter.length; i++) {
	for (let j = 0; j < i; j++) {
		if (worse(withAfter[i].after, withAfter[j].after, objective.direction)) {
			regressions.push({ later: withAfter[i], earlier: withAfter[j] })
			break
		}
	}
}
for (const r of regressions) {
	out.push(
		`  BACKWARDS attempt ${r.later.id} (${r.later.after}) is worse than accepted attempt ` +
			`${r.earlier.id} (${r.earlier.after}). Banked noise, or a dominated variant still live.`,
	)
}
if (withAfter.length) {
	const first = withAfter[0]
	const last = withAfter[withAfter.length - 1]
	const target = num(objective.threshold)
	out.push(
		`  ${objective.name}: ${first.after} -> ${last.after} over ${withAfter.length} accepted` +
			(target === null
				? ''
				: `, target ${target} ${better(last.after, target, objective.direction) ? 'met on this set' : 'not met'}`),
	)
}
if (!regressions.length && withAfter.length > 1) out.push('  monotonic, nothing banked backwards')

// ---------------------------------------------------------------- calibration
// The question an idea classifier presupposes: are predictions about this system any good?
out.push('', 'CALIBRATION OF YOUR OWN PRIORS')
const buckets = PRIORS.map((p) => {
	const rows = attempts.filter((a) => a.prior === p)
	return { p, n: rows.length, kept: rows.filter((a) => a.verdict === 'kept').length }
}).filter((b) => b.n > 0)

const strayPriors = [
	...new Set(attempts.map((a) => a.prior).filter((p) => p && !PRIORS.includes(p))),
]
if (strayPriors.length) {
	out.push(
		`  UNRECOGNISED prior value(s) ${strayPriors.map((p) => `"${p}"`).join(', ')}, excluded ` +
			`from the counts below. Expected one of ${PRIORS.join(', ')}.`,
	)
}
if (!buckets.length) {
	out.push('  no prior column filled in, so nothing can be said about whether you can predict')
} else {
	for (const b of buckets) {
		out.push(`  ${b.p.padEnd(10)} ${b.kept}/${b.n} kept (${Math.round((100 * b.kept) / b.n)}%)`)
	}
	const rate = (name) => {
		const b = buckets.find((x) => x.p === name)
		return b ? b.kept / b.n : null
	}
	const hi = rate('likely')
	const lo = rate('longshot')
	if (hi !== null && lo !== null && buckets.every((b) => b.n >= 3)) {
		out.push(
			hi > lo
				? '  your priors carry signal. Ordering the queue by them is earning something.'
				: '  your priors carry no signal here. Rank by cluster share instead, and distrust any ' +
						'filter that screens ideas on how good they sound.',
		)
	}
}

const unaccounted = attempts.filter((a) => !['kept', 'reverted', 'pruned'].includes(a.verdict))
out.push(
	'',
	`${attempts.length} attempts: ${kept.length} kept, ` +
		`${attempts.filter((a) => a.verdict === 'reverted').length} reverted, ` +
		`${attempts.filter((a) => a.verdict === 'pruned').length} pruned` +
		(unaccounted.length ? `, ${unaccounted.length} with no verdict` : ''),
	'Not checked here: whether a mechanism is real, whether the held-out set agrees, and whether',
	'the metric still tracks the complaint. None of those are arithmetic.',
)

process.stdout.write(out.join('\n') + '\n')
