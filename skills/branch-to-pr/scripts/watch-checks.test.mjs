/**
 * Tests for watch-checks.mjs, with a stub `gh` on PATH.
 *
 *   node --test "**\/*.test.mjs"
 *
 * A watcher whose only test is "it ran against a repo with no CI" proves nothing: this repo
 * has no checks configured, so every real run here is silent for the wrong reason.
 */
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'watch-checks.mjs')
const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p))
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' })

/** A repo with an origin/HEAD, which is what the default-branch half of the script reads. */
function repo() {
	const dir = tmp('watch-repo-')
	git(dir, 'init', '-q', '-b', 'main')
	git(dir, 'config', 'user.email', 't@example.com')
	git(dir, 'config', 'user.name', 'T')
	git(dir, 'commit', '-q', '--allow-empty', '-m', 'init')
	git(dir, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main')
	return dir
}

/**
 * A `gh` that answers from a fixture. `prs` is what `pr list` returns; `runs` is what
 * `run list` returns. Anything else exits non-zero, as the real one does for a bad subcommand.
 */
function stubGh({ prs = [], runs = [] } = {}) {
	const dir = tmp('watch-bin-')
	fs.writeFileSync(
		path.join(dir, 'gh'),
		`#!/bin/sh
case "$*" in
  *"pr list"*) printf '%s' '${JSON.stringify(prs)}' ;;
  *"run list"*) printf '%s' '${JSON.stringify(runs)}' ;;
  *) exit 2 ;;
esac
`,
		{ mode: 0o755 },
	)
	return dir
}

// `process.execPath` rather than `node`, because one case strips PATH down to /usr/bin:/bin
// to hide gh, and a version-managed node is not there either.
const runScript = (cwd, bin, extra = []) =>
	spawnSync(process.execPath, [SCRIPT, ...extra, cwd], {
		encoding: 'utf8',
		env: { ...process.env, PATH: bin ? `${bin}:${process.env.PATH}` : '/usr/bin:/bin' },
	})

const failingPr = {
	number: 42,
	headRefName: 'feat/x',
	headRefOid: 'abcdef1234567890',
	statusCheckRollup: [
		{ name: 'build', conclusion: 'SUCCESS' },
		{ name: 'test', conclusion: 'FAILURE' },
	],
}

test('a failing check on an open pull request is reported once per line', () => {
	const out = runScript(repo(), stubGh({ prs: [failingPr] }))
	assert.equal(out.status, 0)
	assert.match(out.stdout, /#42 feat\/x abcdef1: test/)
})

test('a green pull request is silence and exit 0, not an empty report', () => {
	const green = { ...failingPr, statusCheckRollup: [{ name: 'test', conclusion: 'SUCCESS' }] }
	const out = runScript(repo(), stubGh({ prs: [green] }))
	assert.equal(out.stdout, '')
	assert.equal(out.status, 0)
})

test('the default branch has no pull request, so its failed run is read separately', () => {
	const runs = [{ conclusion: 'failure', workflowName: 'ci', headSha: 'fedcba9876543210' }]
	const out = runScript(repo(), stubGh({ prs: [], runs }))
	assert.match(out.stdout, /main \(no PR\) fedcba9: ci/)
})

test('--json answers the same thing as data', () => {
	const out = runScript(repo(), stubGh({ prs: [failingPr] }), ['--json'])
	const [item] = JSON.parse(out.stdout)
	assert.deepEqual(item.checks, ['test'])
	assert.equal(item.what, '#42 feat/x')
})

test('--new stays quiet the second time, and speaks again when the commit changes', () => {
	const dir = repo()
	const bin = stubGh({ prs: [failingPr] })

	assert.match(runScript(dir, bin, ['--new']).stdout, /#42/)
	assert.equal(runScript(dir, bin, ['--new']).stdout, '', 'still red for the same reason')

	const pushed = { ...failingPr, headRefOid: '1111111111111111' }
	const out = runScript(dir, stubGh({ prs: [pushed] }), ['--new'])
	assert.match(out.stdout, /1111111/, 'a new commit failing the same check is new')
})

test('without --new it reports current state, since the caller dedupes', () => {
	const dir = repo()
	const bin = stubGh({ prs: [failingPr] })
	assert.match(runScript(dir, bin).stdout, /#42/)
	assert.match(runScript(dir, bin).stdout, /#42/)
})

test('being unable to answer is exit 1 on stderr, not silence', () => {
	const noGh = runScript(repo(), null)
	assert.equal(noGh.status, 1)
	assert.match(noGh.stderr, /gh is not installed/)

	const notARepo = runScript(tmp('watch-plain-'), stubGh())
	assert.equal(notARepo.status, 1)
	assert.match(notARepo.stderr, /not a git repository/)
})

