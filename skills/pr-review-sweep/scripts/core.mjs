import { createHash } from 'node:crypto'
import { mkdir, open, readFile, rename, unlink } from 'node:fs/promises'
import { dirname } from 'node:path'

export const MARKER = 'ari-pr-review-sweep:v1'
const AUTOMATION = [
	MARKER,
	'automated codex review',
	'automated ai review',
	"bot's posting policy",
	'bot posting policy',
	'<!-- sean-dev-x:to-pr-review',
]

export function isAutomated(review, config) {
	return (
		review.user?.type === 'Bot' ||
		/\[bot\]$/.test(review.user?.login ?? '') ||
		config.botLogins.includes(review.user?.login) ||
		[...AUTOMATION, ...config.automatedReviewMarkers].some((marker) =>
			(review.body ?? '').toLowerCase().includes(marker.toLowerCase()),
		)
	)
}

export function hasIndependentReview(pr, reviews, config) {
	return reviews.some(
		(review) =>
			review.user?.login !== pr.user.login &&
			['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED'].includes(review.state) &&
			!isAutomated(review, config),
	)
}

export function triggerFor(pr, discussion) {
	const replies = discussion
		.filter((item) => item.user?.login === pr.user.login)
		.map((item) => [
			item.kind,
			item.id,
			item.updated_at ?? item.submitted_at ?? item.created_at,
			item.body ?? '',
		])
		.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
	const stackedBase = pr.base.ref !== pr.base.repo.default_branch ? pr.base.sha : null
	return createHash('sha256')
		.update(JSON.stringify([pr.head.sha, pr.base.ref, stackedBase, replies]))
		.digest('hex')
		.slice(0, 24)
}

export function publicationMarker(pr, trigger) {
	return `<!-- ${MARKER} pr=${pr.number} head=${pr.head.sha} trigger=${trigger} -->`
}

export function publicationFor(pr, trigger, reviews, actor, allowLegacy = false) {
	const exact = publicationMarker(pr, trigger)
	return reviews.find(
		(review) =>
			review.user?.login === actor &&
			review.state !== 'PENDING' &&
			((review.body ?? '').includes(exact) ||
				(allowLegacy &&
					review.commit_id === pr.head.sha &&
					(review.body ?? '').includes('automated Codex review') &&
					!(review.body ?? '').includes(MARKER))),
	)
}

export function eligibility(
	pr,
	reviews,
	discussion,
	tracked,
	state,
	config,
	now = new Date(),
	retainedPending = false,
) {
	if (pr.state !== 'open' || pr.merged) return { reason: 'closed' }
	if (
		pr.user.login === config.excludeAuthor ||
		pr.user.type === 'Bot' ||
		/\[bot\]$/.test(pr.user.login)
	)
		return { reason: 'excluded_author' }
	if (pr.draft) return { reason: 'draft' }
	if (
		!tracked &&
		!retainedPending &&
		new Date(pr.created_at) < new Date(now.getTime() - config.days * 86400000)
	)
		return { reason: 'outside_window' }
	if (!tracked && hasIndependentReview(pr, reviews, config))
		return { reason: 'existing_independent_review' }
	const trigger = triggerFor(pr, discussion)
	if (tracked?.lastTrigger === trigger) return { reason: 'unchanged', trigger }
	const existing = publicationFor(pr, trigger, reviews, config.actor, !tracked)
	if (existing) return { reason: 'published', trigger, review: existing }
	const failure = state.failures[`${pr.number}:${trigger}`]
	if (failure?.attempts >= config.maxAttempts) return { reason: 'needs_attention', trigger }
	if (failure && new Date(failure.retryAfter) > now) return { reason: 'backoff', trigger }
	return { reason: 'eligible', trigger }
}

function text(value, name, max = 4000) {
	if (typeof value !== 'string' || value.length > max || !value.trim())
		throw new Error(`Invalid ${name}`)
}

export function validateReport(report, packet) {
	if (report.status !== 'complete' || report.allMaterialHunksReviewed !== true)
		throw new Error('Review is incomplete')
	if (report.headSha !== packet.pr.head.sha || report.baseSha !== packet.pr.base.sha)
		throw new Error('Review SHA does not match packet')
	text(report.summary, 'summary', 2000)
	if (!Array.isArray(report.findings) || report.findings.length > 8)
		throw new Error('Invalid findings')
	const paths = new Set(packet.files.map((file) => file.filename))
	const ids = new Set()
	for (const finding of report.findings) {
		text(finding.id, 'finding ID', 100)
		if (!/^[a-z0-9][a-z0-9_-]*$/.test(finding.id) || ids.has(finding.id))
			throw new Error('Finding IDs must be unique slugs')
		ids.add(finding.id)
		if (
			!['P0', 'P1', 'P2', 'P3'].includes(finding.priority) ||
			typeof finding.blocking !== 'boolean' ||
			finding.verified !== true
		)
			throw new Error('Finding is not verified')
		if (!paths.has(finding.path) || !Number.isSafeInteger(finding.line) || finding.line < 1)
			throw new Error('Finding must identify a changed file and line')
		text(finding.title, 'finding title', 180)
		for (const field of ['failure', 'evidence', 'fixCondition']) text(finding[field], field, 1800)
	}
	if (!Array.isArray(report.previousFindings))
		throw new Error('Missing previous finding dispositions')
	const previous = packet.previous?.findings ?? []
	const dispositions = new Map()
	for (const item of report.previousFindings) {
		if (dispositions.has(item.id) || !previous.some((finding) => finding.id === item.id))
			throw new Error('Invalid prior finding ID')
		if (!['fixed', 'still_open', 'not_applicable'].includes(item.status))
			throw new Error('Invalid finding disposition')
		text(item.evidence, 'disposition evidence', 1800)
		if (item.status === 'still_open' && !ids.has(item.id))
			throw new Error('Open prior finding was dropped')
		if (item.status !== 'still_open' && ids.has(item.id))
			throw new Error('Resolved prior finding is still listed')
		dispositions.set(item.id, item)
	}
	if (previous.some((finding) => !dispositions.has(finding.id)))
		throw new Error('An earlier finding was not re-reviewed')
	for (const name of ['testEvidence', 'limitations']) {
		if (!Array.isArray(report[name]) || report[name].length > 30) throw new Error(`Invalid ${name}`)
		report[name].forEach((value) => text(value, name, 1000))
	}
	if (!report.testEvidence.length && !report.limitations.some((value) => /test/i.test(value)))
		throw new Error('Missing test evidence or test limitation')
	return report
}

export function mergeConfidence(report, readiness) {
	if (report.findings.some((finding) => finding.blocking)) return 'changes_needed'
	if (readiness.isDraft) return 'draft'
	if (readiness.mergeable === 'CONFLICTING') return 'conflicts'
	const checks = readiness.statusCheckRollup ?? []
	if (!checks.length) return 'checks_unknown'
	const failed = checks.some((check) =>
		[
			'FAILURE',
			'ERROR',
			'CANCELLED',
			'TIMED_OUT',
			'ACTION_REQUIRED',
			'STARTUP_FAILURE',
			'STALE',
		].includes(check.conclusion ?? check.state),
	)
	if (failed) return 'checks_failed'
	if (
		checks.some(
			(check) =>
				check.status === 'COMPLETED' &&
				!['SUCCESS', 'NEUTRAL', 'SKIPPED'].includes(check.conclusion),
		)
	)
		return 'checks_unknown'
	const pending = checks.some((check) =>
		check.status ? check.status !== 'COMPLETED' : check.state !== 'SUCCESS',
	)
	if (pending) return 'checks_pending'
	if (readiness.reviewDecision === 'CHANGES_REQUESTED') return 'changes_requested'
	if (readiness.reviewDecision === 'REVIEW_REQUIRED') return 'human_approval_required'
	if (readiness.mergeable !== 'MERGEABLE' || readiness.mergeStateStatus !== 'CLEAN')
		return 'merge_gate_pending'
	return 'ready'
}

export function dismissibleReviews(reviews, previous, report, config) {
	const blockers = previous?.findings?.filter((finding) => finding.blocking) ?? []
	if (!blockers.length || report.findings.some((finding) => finding.blocking)) return []
	if (
		!blockers.every((finding) =>
			report.previousFindings.some(
				(item) => item.id === finding.id && item.status !== 'still_open',
			),
		)
	)
		return []
	return reviews
		.filter(
			(review) =>
				review.state === 'CHANGES_REQUESTED' &&
				review.user?.login === config.actor &&
				isAutomated(review, config) &&
				(review.id === previous.reviewId ||
					previous.managedReviewIds?.includes(review.id) ||
					(review.body ?? '').includes(MARKER)),
		)
		.map((review) => review.id)
}

export function reviewBody(pr, trigger, report, readiness) {
	const blocking = report.findings.filter((finding) => finding.blocking).length
	const lines = [
		blocking
			? `Changes needed: ${blocking} blocking finding${blocking === 1 ? '' : 's'}.`
			: 'No blocking findings.',
		'',
		`Automated Codex review of \`${pr.head.sha}\` against PR base \`${pr.base.sha}\`.`,
		'',
	]
	for (const finding of [...report.findings].sort((a, b) => a.priority.localeCompare(b.priority))) {
		const url = `https://github.com/${pr.base.repo.full_name}/blob/${pr.head.sha}/${finding.path.split('/').map(encodeURIComponent).join('/')}#L${finding.line}`
		lines.push(
			`**${finding.priority}, ${finding.blocking ? 'blocking' : 'non-blocking'}: ${finding.title}**`,
			`${finding.failure} [${finding.path}:${finding.line}](${url})`,
			`Evidence: ${finding.evidence}`,
			`Fix condition: ${finding.fixCondition}`,
			'',
		)
	}
	if (report.previousFindings.length) {
		lines.push('Earlier findings:', '')
		for (const item of report.previousFindings)
			lines.push(`- \`${item.id}\`: ${item.status.replaceAll('_', ' ')}. ${item.evidence}`)
		lines.push('')
	}
	lines.push(
		`Merge confidence: **${mergeConfidence(report, readiness).replaceAll('_', ' ')}**. GitHub checks, conflicts, and required human approvals remain separate from this code verdict.`,
		'',
		...report.testEvidence.map((value) => `- ${value}`),
	)
	if (report.limitations.length) lines.push('', `Not checked: ${report.limitations.join(' ')}`)
	lines.push('', publicationMarker(pr, trigger))
	const body = lines.join('\n')
	if (body.length > 24000) throw new Error('Review body exceeds publication limit')
	return body
}

export async function readJson(path, fallback) {
	try {
		return JSON.parse(await readFile(path, 'utf8'))
	} catch (error) {
		if (error.code === 'ENOENT') return fallback
		throw error
	}
}

export async function writeJson(path, value) {
	await mkdir(dirname(path), { recursive: true })
	const temp = `${path}.${process.pid}.tmp`
	const handle = await open(temp, 'w', 0o600)
	try {
		await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`)
		await handle.sync()
	} finally {
		await handle.close()
	}
	await rename(temp, path)
}

export async function acquireLock(path) {
	await mkdir(dirname(path), { recursive: true })
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const handle = await open(path, 'wx', 0o600)
			await handle.writeFile(JSON.stringify({ pid: process.pid }))
			await handle.close()
			return async () => {
				await unlink(path)
			}
		} catch (error) {
			if (error.code !== 'EEXIST') throw error
			const owner = await readJson(path, null)
			if (!Number.isInteger(owner?.pid))
				throw new Error('Watcher lock is unreadable; inspect it before retrying')
			try {
				process.kill(owner.pid, 0)
				return null
			} catch (signalError) {
				if (signalError.code !== 'ESRCH') return null
			}
			// Serialize stale-lock recovery so a second reaper cannot unlink a new owner.
			let reaper
			try {
				reaper = await open(`${path}.reaper`, 'wx', 0o600)
			} catch (reaperError) {
				if (reaperError.code === 'EEXIST') return null
				throw reaperError
			}
			try {
				const current = await readJson(path, null)
				if (current?.pid !== owner.pid) continue
				try {
					process.kill(current.pid, 0)
					return null
				} catch (signalError) {
					if (signalError.code !== 'ESRCH') return null
				}
				await unlink(path).catch((unlinkError) => {
					if (unlinkError.code !== 'ENOENT') throw unlinkError
				})
			} finally {
				await reaper.close()
				await unlink(`${path}.reaper`)
			}
		}
	}
	return null
}
