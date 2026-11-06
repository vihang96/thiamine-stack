import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { afterEach, test } from 'node:test'
import { command, emptyState, loadConfig, runReviewer, sweep } from '../scripts/watcher.mjs'
import { acquireLock, writeJson } from '../scripts/core.mjs'
import { cleanup } from '../scripts/cleanup.mjs'

const exec = promisify(execFile)
const directories = []
afterEach(async () => {
	await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})
async function fixture() {
	const root = await mkdtemp(join(tmpdir(), 'pr-sweep-cleanup-'))
	directories.push(root)
	return root
}

for (const outcome of ['success', 'failure', 'timeout']) {
	test(`reviewer removes all scratch after ${outcome} and preserves evidence`, async () => {
		const root = await fixture()
		const source = join(root, 'source')
		await mkdir(source)
		await exec('/usr/bin/git', ['init', source])
		await exec('/usr/bin/git', [
			'-C',
			source,
			'-c',
			'user.name=Test',
			'-c',
			'user.email=test@example.com',
			'commit',
			'--allow-empty',
			'-m',
			'fixture',
		])
		const { stdout } = await exec('/usr/bin/git', ['-C', source, 'rev-parse', 'HEAD'])
		const sha = stdout.trim()
		const codex = join(root, 'codex.mjs')
		await writeFile(
			codex,
			`#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const args = process.argv.slice(2);
const dir = args[args.indexOf('--add-dir') + 1];
await mkdir(join(dir, 'scratch', 'cache'), { recursive: true });
await mkdir(join(dir, 'evidence'), { recursive: true });
await writeFile(join(dir, 'scratch', 'cache', 'snapshot'), 'temporary');
await writeFile(join(dir, 'evidence', 'repro.log'), 'retained evidence');
await writeFile(args[args.indexOf('--output-last-message') + 1], '{}');
${outcome === 'timeout' ? 'setInterval(() => {}, 1000);' : `process.exitCode = ${outcome === 'success' ? 0 : 1};`}
`,
		)
		await chmod(codex, 0o700)
		const env = {
			GIT_CONFIG_COUNT: '1',
			GIT_CONFIG_KEY_0: `url.${source}.insteadOf`,
			GIT_CONFIG_VALUE_0: 'https://github.com/Org/repo.git',
		}
		const previous = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]))
		Object.assign(process.env, env)
		const runDir = join(root, 'run')
		await mkdir(runDir)
		try {
			const review = runReviewer(
				{
					repo: 'Org/repo',
					repositoryPath: source,
					gitPath: '/usr/bin/git',
					codexPath: codex,
					reviewTimeoutMinutes: outcome === 'timeout' ? 1 / 60 : 1,
				},
				{ pr: { number: 1, head: { sha }, base: { sha } } },
				runDir,
			)
			if (outcome === 'success') await review
			else await assert.rejects(review, outcome === 'failure' ? /exited 1/ : /timed out/)
		} finally {
			for (const [key, value] of Object.entries(previous)) {
				if (value === undefined) delete process.env[key]
				else process.env[key] = value
			}
		}
		assert.equal(await readFile(join(runDir, 'evidence', 'repro.log'), 'utf8'), 'retained evidence')
		assert.equal((await readdir(runDir)).includes('scratch'), false)
		assert.equal((await readdir(runDir)).includes('checkout'), false)
		const prompt = await readFile(join(runDir, 'prompt.txt'), 'utf8')
		assert.match(prompt, /Save small reproduction scripts and text logs/)
	})
}

test('a not-due tick recovers abandoned scratch before returning', async () => {
	const root = await fixture()
	const scratch = join(root, 'runs', 'abandoned', 'scratch')
	await mkdir(scratch, { recursive: true })
	await writeFile(join(scratch, 'cache'), 'temporary')
	await writeJson(join(root, 'state.json'), { ...emptyState(), lastScheduledDate: '2026-11-05' })
	const result = await sweep(
		{ stateDirectory: root, timezone: 'UTC' },
		{ scheduled: true, now: new Date('2026-11-05T12:00:00Z') },
	)
	assert.equal(result.status, 'not_due')
	assert.equal((await readdir(join(root, 'runs', 'abandoned'))).includes('scratch'), false)
})

const now = new Date('2026-11-05T12:00:00Z')
const runName = (day, number) => `2026-10-${day}T12-00-00.000Z-${number}-abcdef`
async function stateFixture() {
	const root = await fixture()
	await writeJson(join(root, 'state.json'), emptyState())
	return root
}
async function artifact(root, run, path = 'evidence/repro.log') {
	const target = join(root, 'runs', run, path)
	await mkdir(join(target, '..'), { recursive: true })
	await writeFile(target, 'retained evidence')
	return target
}

test('seven-day retention preserves active, pending, failed, and recent runs', async () => {
	const root = await stateFixture()
	const names = [
		runName('01', 1),
		runName('02', 2),
		runName('03', 3),
		runName('04', 4),
		runName('31', 5),
		runName('05', 6),
	]
	for (const name of names) await artifact(root, name)
	const runDir = (index) => join(root, 'runs', names[index])
	const state = emptyState()
	state.tracked[1] = { runDir: runDir(0) }
	state.pending['2:trigger'] = { runDir: runDir(1) }
	state.failures['3:trigger'] = { runDir: runDir(2) }
	state.tracked[6] = { runDir: runDir(5), closedAt: now.toISOString() }
	await writeJson(join(root, 'state.json'), state)
	const preview = await cleanup({ stateDirectory: root }, { dryRun: true, now })
	assert.deepEqual(preview.removed.sort(), [runDir(3), runDir(5)].sort())
	assert.equal((await readdir(join(root, 'runs'))).length, 6)
	await cleanup({ stateDirectory: root }, { now })
	assert.deepEqual(
		(await readdir(join(root, 'runs'))).sort(),
		[names[0], names[1], names[2], names[4]].sort(),
	)
	assert.deepEqual(JSON.parse(await readFile(join(root, 'state.json'), 'utf8')), state)
})

test('legacy cleanup removes known caches and links while preserving evidence and external dependencies', async () => {
	const root = await stateFixture()
	const run = runName('31', 1)
	const external = join(root, 'shared-dependencies')
	await mkdir(external)
	await writeFile(join(external, 'keep'), 'shared')
	await artifact(root, run)
	await artifact(root, run, 'diagnostics/pglite-cache/snapshot')
	await artifact(root, run, 'diagnostics/repro.mjs')
	await artifact(root, run, 'unknown/dont-delete')
	await artifact(root, run, 'scratch/npm-cache/temporary')
	const link = join(root, 'runs', run, 'node_modules')
	await symlink(external, link)
	const settings = { stateDirectory: root }
	const preview = await cleanup(settings, { dryRun: true, legacy: true, now })
	assert.equal(preview.removed.length, 3)
	assert.equal(
		await readFile(join(root, 'runs', run, 'diagnostics/pglite-cache/snapshot'), 'utf8'),
		'retained evidence',
	)
	const applied = await cleanup(settings, { legacy: true, now })
	assert.deepEqual(applied.removed.sort(), preview.removed.sort())
	assert.equal(await readFile(join(external, 'keep'), 'utf8'), 'shared')
	assert.equal(
		await readFile(join(root, 'runs', run, 'evidence/repro.log'), 'utf8'),
		'retained evidence',
	)
	assert.equal(
		await readFile(join(root, 'runs', run, 'diagnostics/repro.mjs'), 'utf8'),
		'retained evidence',
	)
	assert.equal(
		await readFile(join(root, 'runs', run, 'unknown/dont-delete'), 'utf8'),
		'retained evidence',
	)
})

test('cleanup shares the sweep lock and refuses missing or corrupt state', async () => {
	const root = await stateFixture()
	await artifact(root, runName('31', 1), 'scratch/cache')
	const release = await acquireLock(join(root, 'sweep.lock'))
	try {
		assert.deepEqual(await cleanup({ stateDirectory: root }), { status: 'already_running' })
	} finally {
		await release()
	}
	for (const state of [
		null,
		{ version: 1, tracked: [], failures: {} },
		{ ...emptyState(), pending: [] },
	]) {
		await writeJson(join(root, 'state.json'), state)
		await assert.rejects(cleanup({ stateDirectory: root }), /Invalid watcher state/)
	}
	await rm(join(root, 'state.json'))
	await assert.rejects(cleanup({ stateDirectory: root }), /Invalid watcher state/)
})

test('cleanup refuses a symlinked runs root and does not follow individual run symlinks', async () => {
	const root = await stateFixture()
	const external = join(root, 'external')
	await mkdir(external)
	await writeFile(join(external, 'keep'), 'shared')
	await symlink(external, join(root, 'runs'))
	await assert.rejects(cleanup({ stateDirectory: root }), /Expected a real directory/)
	await rm(join(root, 'runs'))
	await mkdir(join(root, 'runs'))
	await symlink(external, join(root, 'runs', runName('01', 1)))
	assert.deepEqual((await cleanup({ stateDirectory: root }, { legacy: true, now })).removed, [])
	assert.equal(await readFile(join(external, 'keep'), 'utf8'), 'shared')
})

test('cleanup skips a surviving reviewer group after its watcher dies', async () => {
	const root = await stateFixture()
	const run = runName('01', 1)
	await artifact(root, run, 'scratch/cache')
	const pidPath = join(root, 'runs', run, 'reviewer-process.json')
	const worker = command(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
		pidPath,
		timeout: 1500,
	})
	const stopped = assert.rejects(worker, /timed out/)
	while (!(await readdir(join(root, 'runs', run))).includes('reviewer-process.json'))
		await new Promise((done) => setTimeout(done, 10))
	const result = await cleanup({ stateDirectory: root }, { now })
	assert.deepEqual(result.removed, [])
	assert.deepEqual(result.skipped, [{ path: join(root, 'runs', run), reason: 'reviewer_running' }])
	await stopped
	assert.deepEqual((await cleanup({ stateDirectory: root }, { now })).removed, [
		join(root, 'runs', run),
	])
})

test('reviewer command terminates descendants before reporting completion', async () => {
	const root = await fixture()
	const childPid = join(root, 'descendant.pid')
	await command(
		process.execPath,
		[
			'-e',
			`
const { spawn } = require('node:child_process');
const { writeFileSync } = require('node:fs');
const child = spawn(process.execPath, ['-e', 'process.on("SIGTERM", () => {}); setInterval(() => {}, 1000)'], { stdio: 'ignore' });
writeFileSync(${JSON.stringify(childPid)}, String(child.pid));
child.unref();
setTimeout(() => process.exit(0), 250);
`,
		],
		{ pidPath: join(root, 'reviewer-process.json') },
	)
	const pid = Number(await readFile(childPid, 'utf8'))
	for (let attempt = 0; attempt < 100; attempt++) {
		try {
			process.kill(pid, 0)
		} catch (error) {
			assert.equal(error.code, 'ESRCH')
			return
		}
		await new Promise((done) => setTimeout(done, 10))
	}
	assert.fail('reviewer descendant survived cleanup')
})

test('config defaults to seven days and rejects invalid retention windows', async () => {
	const root = await fixture()
	const path = join(root, 'config.json')
	const example = JSON.parse(
		await readFile(new URL('../config.example.json', import.meta.url), 'utf8'),
	)
	delete example.retentionDays
	await writeJson(path, example)
	assert.equal((await loadConfig(path)).retentionDays, 7)
	for (const retentionDays of [0, -1, '7', 1.5]) {
		await writeJson(path, { ...example, retentionDays })
		await assert.rejects(loadConfig(path), /Invalid retentionDays/)
	}
})

test('automatic cleanup refuses missing state when earlier runs exist', async () => {
	const root = await fixture()
	const evidence = await artifact(root, runName('01', 1))
	await assert.rejects(
		sweep({ stateDirectory: root, timezone: 'UTC' }, { scheduled: true, now }),
		/state is missing/,
	)
	assert.equal(await readFile(evidence, 'utf8'), 'retained evidence')
})

test('new watchers initialize state before a draft run can be interrupted', async () => {
	const root = await fixture()
	await assert.rejects(
		sweep(
			{ stateDirectory: root, timezone: 'UTC' },
			{
				dryRun: true,
				now,
				github: {
					actor: async () => {
						throw new Error('interrupted')
					},
				},
			},
		),
		/interrupted/,
	)
	assert.deepEqual(JSON.parse(await readFile(join(root, 'state.json'), 'utf8')), emptyState())
	await artifact(root, runName('01', 1))
	await assert.rejects(
		sweep(
			{ stateDirectory: root, timezone: 'UTC' },
			{
				scan: true,
				now,
				github: {
					actor: async () => {
						throw new Error('interrupted')
					},
				},
			},
		),
		/interrupted/,
	)
})

test('legacy cleanup protects reviewers launched before process tracking existed', async () => {
	const root = await stateFixture()
	const run = runName('01', 1)
	const evidence = await artifact(root, run)
	const worker = command(
		process.execPath,
		['-e', 'setInterval(() => {}, 1000)', join(root, 'runs', run)],
		{ timeout: 1500 },
	)
	const stopped = assert.rejects(worker, /timed out/)
	const result = await cleanup({ stateDirectory: root }, { legacy: true, now })
	assert.deepEqual(result.removed, [])
	assert.deepEqual(result.skipped, [
		{ path: join(root, 'runs', run), reason: 'legacy_process_running' },
	])
	assert.equal(await readFile(evidence, 'utf8'), 'retained evidence')
	await stopped
})

test('a timeout remains a failure when the worker exits successfully on SIGTERM', async () => {
	const root = await fixture()
	await assert.rejects(
		command(
			process.execPath,
			['-e', 'process.on("SIGTERM", () => process.exit(0)); setInterval(() => {}, 1000)'],
			{
				timeout: 500,
				pidPath: join(root, 'reviewer-process.json'),
			},
		),
		/timed out/,
	)
})
