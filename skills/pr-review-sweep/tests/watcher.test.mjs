import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, test } from 'node:test'
import {
	acquireLock,
	dismissibleReviews,
	eligibility,
	hasIndependentReview,
	mergeConfidence,
	publicationMarker,
	triggerFor,
	validateReport,
	writeJson,
} from '../scripts/core.mjs'
import { emptyState, scheduledDate, sweep } from '../scripts/watcher.mjs'
import { plist } from '../scripts/service.mjs'

const directories = []
afterEach(async () => {
	await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})
const now = new Date('2026-10-14T21:00:00Z')
const head = 'a'.repeat(40),
	base = 'b'.repeat(40)
const config = {
	repo: 'Org/repo',
	actor: 'operator',
	excludeAuthor: 'operator',
	days: 7,
	maxAttempts: 3,
	maxReviewsPerRun: 12,
	botLogins: ['reviewbot'],
	automatedReviewMarkers: [],
	blockingEvent: 'COMMENT',
	timezone: 'America/Los_Angeles',
}
const pr = () => ({
	number: 1,
	state: 'open',
	draft: false,
	created_at: '2026-10-13T00:00:00Z',
	user: { login: 'author', type: 'User' },
	head: { sha: head },
	base: { sha: base, ref: 'stack-parent', repo: { full_name: 'Org/repo' } },
	changed_files: 1,
})
const finding = {
	id: 'lost-retry-state',
	priority: 'P2',
	blocking: true,
	path: 'src/a.ts',
	line: 3,
	title: 'Preserve retry state',
	failure: 'A repeated receipt loses its code and schedules a resend.',
	evidence: 'A real persistence reproduction returns retryScheduled=true.',
	fixCondition: 'Persist the terminal code before retry settlement.',
	verified: true,
}
const report = (packet) => ({
	status: 'complete',
	headSha: packet.pr.head.sha,
	baseSha: packet.pr.base.sha,
	allMaterialHunksReviewed: true,
	summary: 'Reviewed receipt persistence and settlement.',
	findings: [],
	previousFindings: (packet.previous?.findings ?? []).map((item) => ({
		id: item.id,
		status: 'fixed',
		evidence: 'The corrected transaction preserves the failure code; its regression passes.',
	})),
	testEvidence: ['One focused regression passes.'],
	limitations: ['Live providers were not exercised.'],
})
const ready = () => ({
	isDraft: false,
	mergeable: 'MERGEABLE',
	mergeStateStatus: 'CLEAN',
	reviewDecision: 'APPROVED',
	statusCheckRollup: [{ status: 'COMPLETED', conclusion: 'SUCCESS' }],
})

class Remote {
	prs = [pr()]
	reviews = []
	discussion = []
	posts = []
	dismissed = []
	readinessValue = ready()
	async actor() {
		return config.actor
	}
	async openPrs() {
		return structuredClone(this.prs.filter((item) => item.state === 'open'))
	}
	async pr(number) {
		return structuredClone(this.prs.find((item) => item.number === Number(number)))
	}
	async context() {
		return structuredClone({ reviews: this.reviews, discussion: this.discussion })
	}
	async files() {
		return [{ filename: 'src/a.ts' }]
	}
	async readiness() {
		return { ...structuredClone(this.readinessValue), headRefOid: this.prs[0].head.sha }
	}
	async publish(target, body, event) {
		const row = {
			id: this.posts.length + 100,
			user: { login: config.actor, type: 'User' },
			body,
			state: event === 'REQUEST_CHANGES' ? 'CHANGES_REQUESTED' : 'COMMENTED',
			commit_id: target.head.sha,
			html_url: `https://github.com/Org/repo/pull/1#review-${this.posts.length + 100}`,
		}
		this.posts.push(row)
		this.reviews.push(row)
		return structuredClone(row)
	}
	async dismiss(target, id) {
		this.dismissed.push(id)
		this.reviews.find((item) => item.id === id).state = 'DISMISSED'
		return {}
	}
}

async function fixture(overrides = {}) {
	const dir = await mkdtemp(join(tmpdir(), 'pr-sweep-test-'))
	directories.push(dir)
	const settings = { ...config, stateDirectory: dir, ...overrides }
	const remote = new Remote()
	return {
		dir,
		settings,
		remote,
		run: (options) =>
			sweep(settings, {
				github: remote,
				reviewer: async (_config, packet) => report(packet),
				now,
				...options,
			}),
	}
}

test('excludes author replies and explicit automation, retains independent human-account reviews', () => {
	const target = pr()
	assert.equal(
		hasIndependentReview(target, [{ user: target.user, state: 'COMMENTED' }], config),
		false,
	)
	assert.equal(
		hasIndependentReview(
			target,
			[
				{
					user: { login: 'person', type: 'User' },
					state: 'COMMENTED',
					body: "Submitted under the bot's posting policy.",
				},
			],
			config,
		),
		false,
	)
	assert.equal(
		hasIndependentReview(
			target,
			[
				{
					user: { login: 'person', type: 'User' },
					state: 'COMMENTED',
					body: 'Please keep the existing owner check.',
				},
			],
			config,
		),
		true,
	)
})

test('publication is pinned and unchanged sweeps do not repost', async () => {
	const f = await fixture()
	await f.run()
	await f.run()
	assert.equal(f.remote.posts.length, 1)
	assert.equal(f.remote.posts[0].commit_id, head)
	assert.match(f.remote.posts[0].body, /ari-pr-review-sweep:v1/)
	assert.equal((await f.run({ scan: true })).skipped[0].reason, 'unchanged')
})

test('tracks new heads after discovery expires and verifies every old finding', async () => {
	const f = await fixture()
	await f.run({ reviewer: async (_config, packet) => ({ ...report(packet), findings: [finding] }) })
	f.remote.prs[0].head.sha = 'c'.repeat(40)
	f.remote.prs[0].created_at = '2026-08-01T00:00:00Z'
	const second = await f.run()
	assert.equal(second.reviewed.length, 1)
	assert.match(f.remote.posts[1].body, /lost-retry-state.*fixed/)
	const state = JSON.parse(await readFile(join(f.dir, 'state.json')))
	assert.equal(state.tracked[1].confidence, 'ready')
	assert.deepEqual(state.tracked[1].findings, [])
})

test('new author replies trigger review even on the same SHA; bot replies do not', async () => {
	const f = await fixture()
	await f.run()
	f.remote.discussion.push({
		id: 1,
		kind: 'issue',
		user: { login: 'reviewbot' },
		body: 'Updated summary',
		updated_at: now.toISOString(),
	})
	await f.run()
	assert.equal(f.remote.posts.length, 1)
	f.remote.discussion.push({
		id: 2,
		kind: 'issue',
		user: { login: 'author' },
		body: 'The existing guard handles this input; see the added evidence.',
		updated_at: now.toISOString(),
	})
	await f.run()
	assert.equal(f.remote.posts.length, 2)
})

test('changed heads and newly arriving independent reviews prevent publication', async () => {
	const changed = await fixture()
	await changed.run({
		reviewer: async (_config, packet) => {
			changed.remote.prs[0].head.sha = 'd'.repeat(40)
			return report(packet)
		},
	})
	assert.equal(changed.remote.posts.length, 0)
	const human = await fixture()
	await human.run({
		reviewer: async (_config, packet) => {
			human.remote.reviews.push({
				user: { login: 'teammate', type: 'User' },
				state: 'APPROVED',
				body: 'Reviewed the transaction.',
			})
			return report(packet)
		},
	})
	assert.equal(human.remote.posts.length, 0)
})

test('an accepted review with a lost response is reconciled without duplicate publication', async () => {
	const f = await fixture()
	const publish = f.remote.publish.bind(f.remote)
	f.remote.publish = async (...args) => {
		await publish(...args)
		throw new Error('connection reset after commit')
	}
	const result = await f.run()
	assert.equal(result.failed.length, 0)
	await f.run()
	assert.equal(f.remote.posts.length, 1)
})

test('restores an accepted pending review after a process failure using the durable outbox', async () => {
	const f = await fixture()
	const target = pr(),
		trigger = triggerFor(target, []),
		draft = report({ pr: target })
	const state = emptyState()
	state.pending[`1:${trigger}`] = {
		trigger,
		report: draft,
		readiness: ready(),
		runDir: f.dir,
		dismissals: [],
	}
	await writeJson(join(f.dir, 'state.json'), state)
	await f.remote.publish(
		target,
		`Automated Codex review\n${publicationMarker(target, trigger)}`,
		'COMMENT',
	)
	await f.run()
	const recovered = JSON.parse(await readFile(join(f.dir, 'state.json')))
	assert.equal(recovered.tracked[1].headSha, head)
	assert.deepEqual(recovered.pending, {})
	assert.equal(f.remote.posts.length, 1)
})

test('incomplete reviews and dropped earlier blockers cannot be published', () => {
	const packet = { pr: pr(), files: [{ filename: 'src/a.ts' }], previous: { findings: [finding] } }
	assert.throws(
		() => validateReport({ ...report(packet), allMaterialHunksReviewed: false }, packet),
		/incomplete/,
	)
	assert.throws(
		() => validateReport({ ...report(packet), previousFindings: [] }, packet),
		/earlier finding/,
	)
	assert.throws(
		() =>
			validateReport(
				{
					...report(packet),
					previousFindings: [
						{ id: finding.id, status: 'still_open', evidence: 'Still reproducible' },
					],
				},
				packet,
			),
		/dropped/,
	)
})

test('lid closure defers work and the next open-lid tick completes the daily sweep only once', async () => {
	const f = await fixture()
	assert.equal(
		(await f.run({ scheduled: true, isOpen: async () => false })).status,
		'laptop_closed',
	)
	assert.equal(f.remote.posts.length, 0)
	await f.run({ scheduled: true, isOpen: async () => true })
	assert.equal((await f.run({ scheduled: true, isOpen: async () => true })).status, 'not_due')
	assert.equal(f.remote.posts.length, 1)
})

test('closing the lid during review defers publication', async () => {
	const f = await fixture()
	let open = true,
		reviewerCalls = 0
	const reviewer = async (_config, packet) => {
		reviewerCalls++
		open = false
		return report(packet)
	}
	const result = await f.run({ scheduled: true, isOpen: async () => open, reviewer })
	assert.equal(result.status, 'laptop_closed')
	assert.equal(f.remote.posts.length, 0)
	assert.equal(JSON.parse(await readFile(join(f.dir, 'state.json'))).lastScheduledDate, null)
	open = true
	await f.run({ scheduled: true, isOpen: async () => open, reviewer })
	assert.equal(reviewerCalls, 1)
	assert.equal(f.remote.posts.length, 1)
})

test('recovers an accepted old-head blocking review before reviewing a new head', async () => {
	const f = await fixture({ blockingEvent: 'REQUEST_CHANGES' })
	const target = pr(),
		trigger = triggerFor(target, []),
		draft = { ...report({ pr: target }), findings: [finding] }
	const state = emptyState()
	state.pending[`1:${trigger}`] = {
		trigger,
		report: draft,
		readiness: ready(),
		runDir: f.dir,
		dismissals: [],
	}
	await writeJson(join(f.dir, 'state.json'), state)
	const accepted = await f.remote.publish(
		target,
		`Automated Codex review\n${publicationMarker(target, trigger)}`,
		'REQUEST_CHANGES',
	)
	f.remote.prs[0].head.sha = 'f'.repeat(40)
	let previous
	await f.run({
		reviewer: async (_config, packet) => {
			previous = packet.previous
			return report(packet)
		},
	})
	assert.equal(previous.findings[0].id, finding.id)
	assert.deepEqual(f.remote.dismissed, [accepted.id])
})

test('base updates during a review prevent stale publication and stacked base changes retrigger review', async () => {
	const f = await fixture()
	await f.run({
		reviewer: async (_config, packet) => {
			f.remote.prs[0].base.sha = 'c'.repeat(40)
			return report(packet)
		},
	})
	assert.equal(f.remote.posts.length, 0)
	await f.run()
	assert.equal(f.remote.posts.length, 1)
	f.remote.prs[0].base.sha = 'd'.repeat(40)
	await f.run()
	assert.equal(f.remote.posts.length, 2)
})

test('head advances during readiness never produce a stale ready notice', async () => {
	const f = await fixture()
	f.remote.readinessValue.reviewDecision = 'REVIEW_REQUIRED'
	await f.run()
	f.remote.readinessValue = ready()
	f.remote.readiness = async () => {
		f.remote.prs[0].head.sha = 'c'.repeat(40)
		return { ...ready(), headRefOid: f.remote.prs[0].head.sha }
	}
	await f.run()
	assert.equal(f.remote.posts.length, 1)
})

test('a ready notice deferred by lid closure survives reopening', async () => {
	const f = await fixture()
	f.remote.readinessValue.reviewDecision = 'REVIEW_REQUIRED'
	await f.run()
	f.remote.readinessValue = ready()
	let open = true
	f.remote.readiness = async () => {
		open = false
		return { ...ready(), headRefOid: head }
	}
	const paused = await f.run({ scheduled: true, isOpen: async () => open })
	assert.equal(paused.status, 'laptop_closed')
	assert.equal(f.remote.posts.length, 1)
	open = true
	f.remote.readiness = async () => ({ ...ready(), headRefOid: head })
	await f.run({ scheduled: true, isOpen: async () => open })
	assert.equal(f.remote.posts.length, 2)
})

test('a completed pending draft remains reviewable after it ages out', async () => {
	const f = await fixture()
	let open = true,
		calls = 0
	const reviewer = async (_config, packet) => {
		calls++
		open = false
		return report(packet)
	}
	await f.run({ scheduled: true, isOpen: async () => open, reviewer })
	f.remote.prs[0].created_at = '2026-08-01T00:00:00Z'
	open = true
	await f.run({ scheduled: true, isOpen: async () => open, reviewer })
	assert.equal(calls, 1)
	assert.equal(f.remote.posts.length, 1)
})

test('accepted pending reviews recover even when the PR aged out or became a draft', async () => {
	const f = await fixture()
	const target = pr(),
		trigger = triggerFor(target, []),
		draft = { ...report({ pr: target }), findings: [finding] }
	const state = emptyState()
	state.pending[`1:${trigger}`] = {
		trigger,
		report: draft,
		readiness: ready(),
		runDir: f.dir,
		dismissals: [],
	}
	await writeJson(join(f.dir, 'state.json'), state)
	await f.remote.publish(
		target,
		`Automated Codex review\n${publicationMarker(target, trigger)}`,
		'REQUEST_CHANGES',
	)
	f.remote.prs[0].created_at = '2026-08-01T00:00:00Z'
	f.remote.prs[0].draft = true
	await f.run()
	const recovered = JSON.parse(await readFile(join(f.dir, 'state.json')))
	assert.equal(recovered.tracked[1].findings[0].id, finding.id)
	assert.deepEqual(recovered.pending, {})
})

test('a final ready-notice lid check cannot consume the daily run', async () => {
	const f = await fixture()
	f.remote.readinessValue.reviewDecision = 'REVIEW_REQUIRED'
	await f.run()
	f.remote.readinessValue = ready()
	let checks = 0
	const paused = await f.run({ scheduled: true, isOpen: async () => ++checks < 4 })
	assert.equal(paused.status, 'laptop_closed')
	assert.equal(f.remote.posts.length, 1)
	await f.run({ scheduled: true, isOpen: async () => true })
	assert.equal(f.remote.posts.length, 2)
})

test('backoff leaves the daily queue due until a successful retry', async () => {
	const f = await fixture()
	await f.run({
		scheduled: true,
		isOpen: async () => true,
		reviewer: async () => {
			throw new Error('Temporary provider failure')
		},
	})
	const beforeRetry = await f.run({
		scheduled: true,
		isOpen: async () => true,
		now: new Date(now.getTime() + 15 * 60000),
	})
	assert.equal(beforeRetry.skipped[0].reason, 'backoff')
	const retried = await f.run({
		scheduled: true,
		isOpen: async () => true,
		now: new Date(now.getTime() + 121 * 60000),
	})
	assert.equal(retried.reviewed.length, 1)
	assert.equal(f.remote.posts.length, 1)
})

test('a delayed dismissal never clears a changes request after a blocker returns', async () => {
	const f = await fixture({ blockingEvent: 'REQUEST_CHANGES' })
	await f.run({ reviewer: async (_config, packet) => ({ ...report(packet), findings: [finding] }) })
	const original = f.remote.posts[0].id
	f.remote.prs[0].head.sha = 'c'.repeat(40)
	const dismiss = f.remote.dismiss.bind(f.remote)
	f.remote.dismiss = async () => {
		throw new Error('Temporary dismissal failure')
	}
	await f.run()
	f.remote.dismiss = dismiss
	f.settings.blockingEvent = 'COMMENT'
	f.remote.prs[0].head.sha = 'd'.repeat(40)
	await f.run({ reviewer: async (_config, packet) => ({ ...report(packet), findings: [finding] }) })
	assert.equal(f.remote.reviews.find((item) => item.id === original).state, 'CHANGES_REQUESTED')
	assert.deepEqual(f.remote.dismissed, [])
})

test('a lock prevents overlap and a stale process lock can be reclaimed', async () => {
	const f = await fixture()
	const path = join(f.dir, 'test.lock')
	const release = await acquireLock(path)
	assert.equal(await acquireLock(path), null)
	await release()
	await writeFile(path, JSON.stringify({ pid: 2147483647 }))
	const reclaimed = await acquireLock(path)
	assert.equal(typeof reclaimed, 'function')
	await reclaimed()
})

test('only the watcher own verified-resolved changes requests are dismissed', async () => {
	const f = await fixture({ blockingEvent: 'REQUEST_CHANGES' })
	await f.run({ reviewer: async (_config, packet) => ({ ...report(packet), findings: [finding] }) })
	const old = f.remote.posts[0].id
	f.remote.prs[0].head.sha = 'e'.repeat(40)
	f.remote.reviews.push({
		id: 88,
		user: { login: 'teammate', type: 'User' },
		body: 'Please fix ownership.',
		state: 'CHANGES_REQUESTED',
	})
	await f.run()
	assert.deepEqual(f.remote.dismissed, [old])
	assert.equal(f.remote.reviews.find((item) => item.id === 88).state, 'CHANGES_REQUESTED')
})

test('CI gates remain separate from a clean code verdict and a ready transition sends one notice', async () => {
	const f = await fixture()
	f.remote.readinessValue.reviewDecision = 'REVIEW_REQUIRED'
	await f.run()
	assert.match(f.remote.posts[0].body, /human approval required/)
	f.remote.readinessValue = ready()
	await f.run()
	await f.run()
	assert.equal(f.remote.posts.length, 2)
	assert.match(f.remote.posts[1].body, /Merge confidence: \*\*ready\*\*/)
	assert.equal(
		mergeConfidence(report({ pr: pr() }), { ...ready(), statusCheckRollup: [] }),
		'checks_unknown',
	)
})

test('dry-run and scans never publish or mark a head as reviewed', async () => {
	const f = await fixture()
	await f.run({ scan: true })
	await f.run({ dryRun: true })
	assert.equal(f.remote.posts.length, 0)
	await assert.rejects(readFile(join(f.dir, 'state.json')), { code: 'ENOENT' })
})

test('daily boundary follows Pacific time and launchd coalesces wake checks', () => {
	assert.equal(scheduledDate(config, new Date('2026-10-15T06:30:00Z')), '2026-10-14')
	assert.equal(scheduledDate(config, new Date('2026-10-15T07:30:00Z')), '2026-10-15')
	const source = plist({
		nodePath: '/node',
		scriptPath: '/space & path/run.mjs',
		configPath: '/config',
		stateDirectory: '/state',
		pathEnvironment: '/bin',
	})
	assert.match(source, /StartCalendarInterval/)
	assert.match(source, /space &amp; path/)
	assert.equal((source.match(/<key>Minute<\/key>/g) ?? []).length, 4)
})
