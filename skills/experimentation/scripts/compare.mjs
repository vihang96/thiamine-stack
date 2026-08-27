#!/usr/bin/env node
/**
 * Say whether a change moved a metric, or whether the difference is noise.
 *
 *   node compare.mjs before.txt after.txt              # two independent samples
 *   node compare.mjs --paired before.txt after.txt     # same items scored twice
 *   node compare.mjs --lower-is-better a.txt b.txt     # latency, error count, cost
 *   node compare.mjs --interval final.txt              # one sample, bootstrap interval
 *
 * Input is one number per line. Blank lines and lines starting with # are skipped, so a
 * file can carry a note about what it is. In paired mode the files must be aligned: line N
 * of each is the same item, and a non-numeric line on either side drops that pair.
 *
 * Why a permutation test rather than a t-test: metric samples here are small, bounded, and
 * usually not normal (an overlap score lives in [0,1] and piles up near the top; a latency
 * distribution has a tail). A permutation test assumes none of that. It asks how often pure
 * relabelling produces a difference this large, which is the question actually being asked.
 *
 * Paired mode is the default worth reaching for. Scoring the same documents under two
 * prompts is paired, and treating it as unpaired throws away the pairing and reports noise
 * where there is a real, consistent, small per-item gain.
 *
 * This reports. It does not decide. A p value is not a mechanism, and the skill requires
 * both.
 */
const ITERATIONS = 20000
const ALPHA = 0.05
// Under this many observations, no test has the power to say anything, and reporting a p
// value invites treating an anecdote as a result.
const MIN_N = 5

// Answering "is the target met" needs an interval on one sample, not a comparison of two.
// A point estimate that crossed the target on a lucky sample crosses back, which is why the
// skill's stop condition asks for the interval to be clear of the target rather than the
// median to be past it.
const INTERVAL_MODE = '--interval'

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const files = args.filter((a) => !a.startsWith('--'))

const paired = flags.has('--paired')
const lowerIsBetter = flags.has('--lower-is-better')

const die = (msg) => {
	process.stderr.write(`error: ${msg}\n`)
	process.exit(2)
}

const interval = flags.has(INTERVAL_MODE)
if (interval && (paired || files.length !== 1)) {
	die('--interval takes exactly one file and cannot be paired')
}
if (!interval && files.length !== 2) {
	die(
		'need two files\n' +
			'  usage: node compare.mjs [--paired] [--lower-is-better] before after\n' +
			'         node compare.mjs --interval sample.txt',
	)
}
for (const f of flags) {
	if (!['--paired', '--lower-is-better', INTERVAL_MODE].includes(f)) die(`unknown flag ${f}`)
}

const fs = await import('node:fs')

/** One number per line. Keeps position, so paired mode can align the two files. */
function readSeries(file) {
	let text
	try {
		text = fs.readFileSync(file, 'utf8')
	} catch {
		die(`cannot read ${file}`)
	}
	return text
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => l !== '' && !l.startsWith('#'))
		.map((l) => (Number.isFinite(Number(l)) ? Number(l) : null))
}

const median = (xs) => {
	const s = [...xs].sort((a, b) => a - b)
	const m = s.length >> 1
	return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length
const quantile = (xs, q) => {
	const s = [...xs].sort((a, b) => a - b)
	const pos = (s.length - 1) * q
	const lo = Math.floor(pos)
	return s[lo] + (s[Math.ceil(pos)] - s[lo]) * (pos - lo)
}
const fmt = (n) => {
	if (Number.isInteger(n)) return String(n)
	// Strip trailing zeros without eating the decimal point, and fall back to exponential
	// for a value that rounds to zero at four places, such as the smallest reachable p.
	const s = n.toFixed(4).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
	return Number(s) === 0 ? n.toExponential(1) : s
}

// A deterministic generator, so the same inputs give the same p value. A result that moves
// when you rerun the comparison is one more thing to distrust in a long run.
let seed = 0x2f6e2b1
const rand = () => {
	seed ^= seed << 13
	seed ^= seed >>> 17
	seed ^= seed << 5
	seed >>>= 0
	return seed / 0x100000000
}

if (interval) {
	const xs = readSeries(files[0]).filter((x) => x !== null)
	if (xs.length < MIN_N) die(`only ${xs.length} values, need at least ${MIN_N}`)

	// Resample with replacement and take the median each time. No distributional assumption,
	// which matters for a bounded score that piles up near its ceiling.
	const medians = []
	for (let it = 0; it < ITERATIONS; it++) {
		const draw = new Array(xs.length)
		for (let i = 0; i < xs.length; i++) draw[i] = xs[Math.floor(rand() * xs.length)]
		medians.push(median(draw))
	}
	const lo = quantile(medians, ALPHA / 2)
	const hi = quantile(medians, 1 - ALPHA / 2)

	process.stdout.write(
		`one sample, bootstrap interval\n` +
			`n                ${xs.length}\n` +
			`median           ${fmt(median(xs))}\n` +
			`mean             ${fmt(mean(xs))}\n` +
			`spread           ${fmt(Math.min(...xs))} to ${fmt(Math.max(...xs))}\n` +
			`interquartile    ${fmt(quantile(xs, 0.25))} to ${fmt(quantile(xs, 0.75))}\n` +
			`95% interval     ${fmt(lo)} to ${fmt(hi)} (on the median, ${ITERATIONS} resamples)\n` +
			`\nThe target is met when the whole interval is past it, not when the median is. ` +
			`Compare the ${lowerIsBetter ? 'upper' : 'lower'} bound against your target.\n`,
	)
	process.exit(0)
}

const before = readSeries(files[0])
const after = readSeries(files[1])

let p, observed, n, detail

if (paired) {
	if (before.length !== after.length) {
		die(`paired mode needs aligned files: ${before.length} vs ${after.length} values`)
	}
	const deltas = []
	let dropped = 0
	for (let i = 0; i < before.length; i++) {
		if (before[i] === null || after[i] === null) dropped++
		else deltas.push(after[i] - before[i])
	}
	n = deltas.length
	if (n < MIN_N) die(`only ${n} usable pairs, need at least ${MIN_N} to say anything`)

	observed = mean(deltas)
	// Randomly flip the sign of each item's delta. Under the null the change did nothing,
	// so which direction an item moved is arbitrary.
	let atLeastAsExtreme = 0
	for (let it = 0; it < ITERATIONS; it++) {
		let sum = 0
		for (const d of deltas) sum += rand() < 0.5 ? -d : d
		if (Math.abs(sum / n) >= Math.abs(observed) - 1e-12) atLeastAsExtreme++
	}
	p = (atLeastAsExtreme + 1) / (ITERATIONS + 1)

	const improved = deltas.filter((d) => (lowerIsBetter ? d < 0 : d > 0)).length
	const worsened = deltas.filter((d) => (lowerIsBetter ? d > 0 : d < 0)).length
	// The item that moved worst. When nothing regressed this is the smallest gain, and
	// calling that a regression would be a lie the reader has to check the data to catch.
	// Worth printing either way: a change with a good mean can still ruin one case badly.
	const worst = lowerIsBetter ? Math.max(...deltas) : Math.min(...deltas)
	const worstLabel = worsened > 0 ? 'worst regression' : 'smallest gain   '
	detail =
		`pairs            ${n}${dropped ? ` (${dropped} dropped, unreadable on one side)` : ''}\n` +
		`mean delta       ${fmt(observed)}\n` +
		`median delta     ${fmt(median(deltas))}\n` +
		`per-item         ${improved} better, ${worsened} worse, ${n - improved - worsened} unchanged\n` +
		`${worstLabel} ${fmt(worst)}\n`
} else {
	const a = before.filter((x) => x !== null)
	const b = after.filter((x) => x !== null)
	n = Math.min(a.length, b.length)
	if (n < MIN_N) die(`only ${a.length} and ${b.length} values, need at least ${MIN_N} each`)

	observed = median(b) - median(a)
	const pool = [...a, ...b]
	let atLeastAsExtreme = 0
	for (let it = 0; it < ITERATIONS; it++) {
		// Fisher-Yates over a copy, then split at the original sizes.
		for (let i = pool.length - 1; i > 0; i--) {
			const j = Math.floor(rand() * (i + 1))
			;[pool[i], pool[j]] = [pool[j], pool[i]]
		}
		const d = median(pool.slice(a.length)) - median(pool.slice(0, a.length))
		if (Math.abs(d) >= Math.abs(observed) - 1e-12) atLeastAsExtreme++
	}
	p = (atLeastAsExtreme + 1) / (ITERATIONS + 1)

	// The spread of the baseline is the noise band the skill asks for: a change smaller
	// than the metric's own run-to-run variation is not a result.
	detail =
		`n                ${a.length} before, ${b.length} after\n` +
		`median           ${fmt(median(a))} -> ${fmt(median(b))}\n` +
		`delta            ${fmt(observed)}\n` +
		`baseline spread  ${fmt(quantile(a, 0.25))} to ${fmt(quantile(a, 0.75))} (interquartile)\n` +
		`baseline range   ${fmt(Math.min(...a))} to ${fmt(Math.max(...a))}\n`
}

const better = lowerIsBetter ? observed < 0 : observed > 0
const real = p < ALPHA

process.stdout.write(
	`${paired ? 'paired' : 'unpaired'} comparison, ${lowerIsBetter ? 'lower' : 'higher'} is better\n` +
		`${detail}` +
		`p                ${p < 1 / (ITERATIONS + 1) + 1e-12 ? `<${fmt(1 / (ITERATIONS + 1))}` : fmt(p)} (permutation, ${ITERATIONS} relabellings)\n` +
		`\n${
			!real
				? 'WITHIN NOISE. Not a result. Revert it and log the attempt.'
				: better
					? 'MOVED. Real by this test. Accept only if the guards hold and you can state the mechanism.'
					: 'MOVED THE WRONG WAY. Revert it, and read why before trying a variant.'
		}\n`,
)
