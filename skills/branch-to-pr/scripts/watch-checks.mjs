#!/usr/bin/env node
/**
 * Report failing checks on your open pull requests, and on the default branch.
 *
 *   node watch-checks.mjs [repo-root]           # human readable, quiet when nothing fails
 *   node watch-checks.mjs --json [repo-root]    # the same answer as data
 *   node watch-checks.mjs --new [repo-root]     # only what has changed since it last reported
 *
 * Two callers, and they dedupe differently, which is why `--new` is a flag rather than the
 * default. A cron entry wants only what changed, so it stays quiet on the run that is still
 * red for the reason it was red an hour ago. A session-start hook has its own per-condition
 * cooldown and wants current state.
 *
 * Exit 0 with no output is the real answer "nothing is failing". Exit 1 is this script being
 * unable to answer at all: no `gh`, no auth, not a repo. That distinction is the one
 * `pr-status.sh` and `audit.sh` beside this file already draw, because a silent zero and an
 * empty answer look identical in a scheduler's log.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const root = args.find((a) => !a.startsWith('--')) ?? process.cwd()

const run = (cmd, cmdArgs) => {
	try {
		return execFileSync(cmd, cmdArgs, {
			cwd: root,
			encoding: 'utf8',
			timeout: 20_000,
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim()
	} catch {
		return null
	}
}

const die = (why) => {
	process.stderr.write(`watch-checks: ${why}\n`)
	process.exit(1)
}

if (!run('git', ['rev-parse', '--show-toplevel'])) die(`${root} is not a git repository`)
if (!run('sh', ['-c', 'command -v gh'])) die('gh is not installed, so checks cannot be read')

/** A rollup entry is failing whichever shape this gh version returns it in. */
const failing = (rollup) =>
	(rollup ?? [])
		.filter(
			(c) => c.conclusion === 'FAILURE' || c.state === 'FAILURE' || c.conclusion === 'TIMED_OUT',
		)
		.map((c) => c.name ?? c.context ?? 'check')

const prs = run('gh', [
	'pr',
	'list',
	'--author',
	'@me',
	'--state',
	'open',
	'--json',
	'number,headRefName,headRefOid,statusCheckRollup',
])
if (prs === null) die('gh could not list pull requests, which usually means no auth for this repo')

const red = []
for (const pr of JSON.parse(prs)) {
	const checks = failing(pr.statusCheckRollup)
	if (checks.length === 0) continue
	red.push({
		what: `#${pr.number} ${pr.headRefName}`,
		sha: pr.headRefOid?.slice(0, 7) ?? '',
		checks,
	})
}

// The default branch has no pull request of its own, so its failures only show up here.
const head = run('git', ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'])
const defaultBranch = head?.replace(/^origin\//, '')
if (defaultBranch) {
	const latest = run('gh', [
		'run',
		'list',
		'--branch',
		defaultBranch,
		'--limit',
		'1',
		'--json',
		'conclusion,displayTitle,headSha,workflowName',
	])
	const [last] = latest ? JSON.parse(latest) : []
	if (last && (last.conclusion === 'failure' || last.conclusion === 'timed_out')) {
		red.push({
			what: `${defaultBranch} (no PR)`,
			sha: last.headSha?.slice(0, 7) ?? '',
			checks: [last.workflowName ?? last.displayTitle ?? 'workflow'],
		})
	}
}

/**
 * What was reported last time, so `--new` can stay quiet. Keyed on the head sha as well as
 * the check names: the same PR failing the same check on a new commit is a new failure, and
 * a push that fixed nothing is not.
 */
const ledger = path.join(root, '.thiamine', 'watch-checks.json')
const fingerprint = (item) => `${item.what}@${item.sha}:${item.checks.sort().join(',')}`

let seen = {}
if (flags.has('--new')) {
	try {
		seen = JSON.parse(fs.readFileSync(ledger, 'utf8'))
	} catch {
		seen = {}
	}
}

const report = flags.has('--new') ? red.filter((item) => !seen[fingerprint(item)]) : red

if (flags.has('--new')) {
	const now = Object.fromEntries(red.map((item) => [fingerprint(item), Date.now()]))
	fs.mkdirSync(path.dirname(ledger), { recursive: true })
	fs.writeFileSync(ledger, `${JSON.stringify(now, null, 2)}\n`)
}

if (report.length === 0) process.exit(0)

if (flags.has('--json')) {
	process.stdout.write(`${JSON.stringify(report)}\n`)
} else {
	for (const item of report) {
		process.stdout.write(`${item.what} ${item.sha}: ${item.checks.join(', ')}\n`)
	}
}
