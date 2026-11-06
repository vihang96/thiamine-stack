import { execFile } from 'node:child_process'
import { lstat, readdir, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { acquireLock, readJson } from './core.mjs'

export const DEFAULT_RETENTION_DAYS = 7
const exec = promisify(execFile)
const legacyDirectories = new Set([
	'checkout',
	'.cache',
	'node_modules',
	'npm-cache',
	'vite-cache',
	'vite-cache-web',
	'vite-contracts-cache',
	'vite-visual-cache',
	'review-vite-cache',
	'baseline-vite-cache',
	'vitest-cache',
	'vitest-module-cache',
	'initial-vitest-module-cache',
	'pglite-cache',
	'pglite-snapshot',
	'pglite-snapshots',
	'review-pglite-snapshot',
	'review-deps',
	'diagnostic-deps',
	'review-repro-deps',
	'review-git-objects',
	'jre',
	'jdk-17.0.21+9-jre',
])

async function entries(path) {
	try {
		const info = await lstat(path)
		if (!info.isDirectory()) throw new Error(`Expected a real directory: ${path}`)
		return await readdir(path, { withFileTypes: true })
	} catch (error) {
		if (error.code === 'ENOENT') return []
		throw error
	}
}

function liveGroup(pid) {
	if (!Number.isInteger(pid) || pid < 1) throw new Error('Invalid reviewer process ID')
	try {
		process.kill(process.platform === 'win32' ? pid : -pid, 0)
		return true
	} catch (error) {
		if (error.code === 'ESRCH') return false
		return true
	}
}

function createdAt(name) {
	const match = name.match(/^(\d{4}-\d{2}-\d{2}T)(\d{2})-(\d{2})-(\d{2}\.\d{3}Z)-\d+-[a-f0-9]+$/)
	return match ? Date.parse(`${match[1]}${match[2]}:${match[3]}:${match[4]}`) : NaN
}

// The caller holds sweep.lock, including for previews and scheduled maintenance.
export async function cleanupRuns(
	config,
	state,
	{ dryRun = false, legacy = false, now = new Date() } = {},
) {
	const root = join(config.stateDirectory, 'runs')
	const protectedRuns = new Set(
		[
			...Object.values(state.pending ?? {}),
			...Object.values(state.failures),
			...Object.values(state.tracked).filter((item) => !item.closedAt),
		].flatMap((item) => (item.runDir ? [resolve(item.runDir)] : [])),
	)
	const cutoff = now.getTime() - (config.retentionDays ?? DEFAULT_RETENTION_DAYS) * 86400000
	const result = { dryRun, removed: [], skipped: [] }
	let processCommands
	const remove = async (path) => {
		if (!dryRun) await rm(path, { recursive: true, force: true })
		result.removed.push(path)
	}
	async function cleanLegacy(path) {
		for (const entry of await entries(path)) {
			if (entry.name === 'scratch') continue
			const target = join(path, entry.name)
			if (legacyDirectories.has(entry.name) && (entry.isDirectory() || entry.isSymbolicLink()))
				await remove(target)
			else if (entry.isDirectory()) await cleanLegacy(target)
		}
	}
	for (const entry of await entries(root)) {
		if (!entry.isDirectory()) continue
		const runDir = join(root, entry.name)
		const worker = await readJson(join(runDir, 'reviewer-process.json'), null)
		if (worker && liveGroup(worker.pid)) {
			result.skipped.push({ path: runDir, reason: 'reviewer_running' })
			continue
		}
		if (!worker) {
			// Pre-upgrade reviewers have no process marker. Fail closed if ps fails.
			processCommands ??= (
				await exec('/bin/ps', ['-ww', '-axo', 'command='], {
					timeout: 10000,
					maxBuffer: 16 * 1024 * 1024,
				})
			).stdout.split('\n')
			if (processCommands.some((command) => command.includes(runDir))) {
				result.skipped.push({ path: runDir, reason: 'legacy_process_running' })
				continue
			}
		}
		if (!protectedRuns.has(resolve(runDir)) && createdAt(entry.name) < cutoff) {
			await remove(runDir)
			continue
		}
		const children = await entries(runDir)
		if (children.some((item) => item.name === 'scratch')) await remove(join(runDir, 'scratch'))
		if (legacy) await cleanLegacy(runDir)
	}
	return result
}

export function validateState(state) {
	if (
		state?.version !== 1 ||
		!state.tracked ||
		!state.failures ||
		Array.isArray(state.tracked) ||
		Array.isArray(state.failures) ||
		typeof state.tracked !== 'object' ||
		typeof state.failures !== 'object' ||
		(state.pending != null && (typeof state.pending !== 'object' || Array.isArray(state.pending)))
	)
		throw new Error('Invalid watcher state; refusing cleanup')
	for (const records of [state.tracked, state.pending ?? {}, state.failures]) {
		for (const item of Object.values(records)) {
			if (
				!item ||
				typeof item !== 'object' ||
				Array.isArray(item) ||
				(item.runDir !== undefined && typeof item.runDir !== 'string')
			)
				throw new Error('Invalid watcher state; refusing cleanup')
		}
	}
}

export async function assertNewState(config) {
	if ((await entries(join(config.stateDirectory, 'runs'))).length)
		throw new Error(
			'Watcher state is missing but review runs exist; restore state before continuing',
		)
}

export async function cleanup(config, options = {}) {
	const release = await acquireLock(join(config.stateDirectory, 'sweep.lock'))
	if (!release) return { status: 'already_running' }
	try {
		const state = await readJson(join(config.stateDirectory, 'state.json'), null)
		validateState(state)
		return { status: 'cleanup', ...(await cleanupRuns(config, state, options)) }
	} finally {
		await release()
	}
}
