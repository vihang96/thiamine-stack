/**
 * Tests for the hooks, run as the harness runs them: JSON on stdin, a decision on stdout.
 *
 *   node --test hooks/
 *
 * The Bash cases are the ones worth having. A guard that matches only the Edit tools reads as
 * working right up to the moment a session writes with `cat >`. Nothing caught that, because
 * nothing tested it.
 */
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { bashWrites } from './bash-target.mjs'
import { hasTool, PASSES } from './nudge-state.mjs'
import { firstSignal, SIGNALS } from './signals.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const tmp = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix))
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

/** A fresh HOME per run, so a hook's state file never touches the real one. */
function runHook(name, event, home = tmp('thiamine-home-')) {
	const result = spawnSync('node', [path.join(HERE, name)], {
		input: JSON.stringify(event),
		encoding: 'utf8',
		env: { ...process.env, HOME: home },
	})
	assert.equal(result.status, 0, `${name} exited ${result.status}: ${result.stderr}`)
	return result.stdout.trim()
}

const decisionOf = (out) =>
	out ? JSON.parse(out).hookSpecificOutput?.permissionDecision : undefined
const reasonOf = (out) =>
	out ? JSON.parse(out).hookSpecificOutput?.permissionDecisionReason : undefined
const contextOf = (out) => (out ? JSON.parse(out).hookSpecificOutput?.additionalContext : undefined)

function repo() {
	const dir = tmp('thiamine-repo-')
	git(dir, 'init', '-b', 'main')
	git(dir, 'config', 'user.email', 't@example.com')
	git(dir, 'config', 'user.name', 'T')
	fs.writeFileSync(path.join(dir, 'f.txt'), 'x\n')
	git(dir, 'add', '.')
	git(dir, 'commit', '-m', 'init')
	return dir
}

const HEREDOC_WRITE = "cat > f.txt <<'EOF'\nchanged\nEOF"

test('bashWrites finds redirect, append, tee, and in-place targets', () => {
	assert.deepEqual(bashWrites(HEREDOC_WRITE), { writes: true, paths: ['f.txt'] })
	assert.deepEqual(bashWrites('echo hi >> notes.md').paths, ['notes.md'])
	assert.deepEqual(bashWrites("tee -a log.txt <<'X'\ny\nX").paths, ['log.txt'])
	assert.deepEqual(bashWrites("sed -i '' 's/a/b/' README.md").paths, ['README.md'])
})

test('bashWrites ignores descriptor dups, /dev, and read-only scripts', () => {
	assert.equal(bashWrites('node scripts/validate.mjs 2>&1 | tail -3').writes, false)
	assert.equal(bashWrites('grep foo bar.txt > /dev/null').writes, false)
	assert.equal(bashWrites("python3 - <<'PY'\nprint('hi')\nPY").writes, false)
})

test('bashWrites reports a write it cannot name, and reads no paths out of a heredoc body', () => {
	assert.deepEqual(bashWrites("python3 - <<'PY'\nopen('a.md','w').write('x')\nPY"), {
		writes: true,
		paths: [],
	})
	assert.deepEqual(bashWrites("cat > note.md <<'EOF'\nsee logs/old.txt for detail\nEOF").paths, [
		'note.md',
	])
})

test('branch guard denies a Bash write on the default branch', () => {
	const dir = repo()
	const out = runHook('pre-edit-branch-guard.mjs', {
		tool_name: 'Bash',
		tool_input: { command: HEREDOC_WRITE },
		cwd: dir,
		session_id: 'bash-on-main',
	})
	assert.equal(decisionOf(out), 'deny')
	assert.match(reasonOf(out), /default branch/)
})

test('branch guard still denies an Edit on the default branch', () => {
	const dir = repo()
	const out = runHook('pre-edit-branch-guard.mjs', {
		tool_name: 'Edit',
		tool_input: { file_path: path.join(dir, 'f.txt') },
		cwd: dir,
		session_id: 'edit-on-main',
	})
	assert.equal(decisionOf(out), 'deny')
})

test('branch guard denies a write it cannot name, on the default branch', () => {
	const dir = repo()
	const out = runHook('pre-edit-branch-guard.mjs', {
		tool_name: 'Bash',
		tool_input: { command: "python3 - <<'PY'\nopen('f.txt','w').write('x')\nPY" },
		cwd: dir,
		session_id: 'unnamed-write',
	})
	assert.equal(decisionOf(out), 'deny', 'the case that motivated the change is this one')
})

test('branch guard allows a Bash command that writes nothing', () => {
	const dir = repo()
	const out = runHook('pre-edit-branch-guard.mjs', {
		tool_name: 'Bash',
		tool_input: { command: 'git status --short' },
		cwd: dir,
		session_id: 'read-only',
	})
	assert.equal(out, '')
})

test('branch guard denies on a branch whose remote was deleted, and allows one that has one', () => {
	const dir = repo()
	const bare = tmp('thiamine-remote-')
	git(bare, 'init', '--bare', '-b', 'main')
	git(dir, 'remote', 'add', 'origin', bare)
	git(dir, 'push', '-u', 'origin', 'main')
	git(dir, 'checkout', '-b', 'feat/live')
	git(dir, 'commit', '--allow-empty', '-m', 'work')
	git(dir, 'push', '-u', 'origin', 'feat/live')

	const live = runHook('pre-edit-branch-guard.mjs', {
		tool_name: 'Bash',
		tool_input: { command: HEREDOC_WRITE },
		cwd: dir,
		session_id: 'live-upstream',
	})
	assert.equal(live, '', 'a branch with a live upstream is where work belongs')

	git(dir, 'push', 'origin', '--delete', 'feat/live')
	git(dir, 'fetch', '--prune', 'origin')

	const gone = runHook('pre-edit-branch-guard.mjs', {
		tool_name: 'Bash',
		tool_input: { command: HEREDOC_WRITE },
		cwd: dir,
		session_id: 'gone-upstream',
	})
	assert.equal(decisionOf(gone), 'deny')
	assert.match(reasonOf(gone), /remote branch is gone/)
})

test('branch guard denies once per repo per session', () => {
	const dir = repo()
	const home = tmp('thiamine-home-')
	const event = {
		tool_name: 'Bash',
		tool_input: { command: HEREDOC_WRITE },
		cwd: dir,
		session_id: 'once',
	}
	assert.equal(decisionOf(runHook('pre-edit-branch-guard.mjs', event, home)), 'deny')
	assert.equal(
		runHook('pre-edit-branch-guard.mjs', event, home),
		'',
		"the retry is the agent's call",
	)
})

/** A stand-in thiamine checkout: the two markers findRoot looks for, and a validator that fails. */
function stackRoot() {
	const dir = tmp('thiamine-root-')
	fs.mkdirSync(path.join(dir, 'scripts'))
	fs.mkdirSync(path.join(dir, 'rules'))
	fs.mkdirSync(path.join(dir, 'skills'))
	fs.writeFileSync(path.join(dir, 'rules', 'RULES.md'), '# rules\n')
	fs.writeFileSync(
		path.join(dir, 'scripts', 'validate.mjs'),
		"console.log('ERROR skills/x/SKILL.md')\nconsole.log('    no description')\nprocess.exit(1)\n",
	)
	return dir
}

test('post-edit validate runs after a Bash write inside the stack', () => {
	const dir = stackRoot()
	const out = runHook('post-edit-validate.mjs', {
		tool_name: 'Bash',
		tool_input: { command: "cat > skills/x/SKILL.md <<'EOF'\nhi\nEOF" },
		cwd: dir,
	})
	assert.match(contextOf(out), /ERROR skills\/x\/SKILL\.md/)
})

test('post-edit validate runs for a write it cannot name, and stays quiet otherwise', () => {
	const dir = stackRoot()
	const unnamed = runHook('post-edit-validate.mjs', {
		tool_name: 'Bash',
		tool_input: { command: "python3 - <<'PY'\nopen('skills/x/SKILL.md','w').write('hi')\nPY" },
		cwd: dir,
	})
	assert.match(contextOf(unnamed), /ERROR/)

	const readOnly = runHook('post-edit-validate.mjs', {
		tool_name: 'Bash',
		tool_input: { command: 'git log --oneline -3' },
		cwd: dir,
	})
	assert.equal(readOnly, '')

	const notAnEdit = runHook('post-edit-validate.mjs', {
		tool_name: 'BashOutput',
		tool_input: { bash_id: '1' },
		cwd: dir,
	})
	assert.equal(notAnEdit, '', 'a matcher of Bash also matches BashOutput, which edits nothing')

	const elsewhere = runHook('post-edit-validate.mjs', {
		tool_name: 'Bash',
		tool_input: { command: 'echo x > /tmp/scratch.txt' },
		cwd: dir,
	})
	assert.equal(elsewhere, '', 'a write outside the watched directories is not its business')
})

const longBody = 'word '.repeat(300)

test('pr body budget counts a body the invocation is actually writing', () => {
	const create = runHook('pr-body-budget.mjs', {
		tool_name: 'Bash',
		tool_input: { command: `gh pr create --title x --body "$(cat <<'EOF'\n${longBody}\nEOF\n)"` },
	})
	assert.match(contextOf(create), /against a 250 word budget/)

	const rest = runHook('pr-body-budget.mjs', {
		tool_name: 'Bash',
		tool_input: {
			command: `gh api --method PATCH repos/o/r/pulls/15 -f body="$(cat <<'EOF'\n${longBody}\nEOF\n)"`,
		},
	})
	assert.match(contextOf(rest), /against a 250 word budget/, 'the REST path writes a body too')
})

test('pr body budget ignores an invocation named inside a heredoc body', () => {
	const out = runHook('pr-body-budget.mjs', {
		tool_name: 'Bash',
		tool_input: {
			command: `cat > .handoff-main.md <<'EOF'\ngh pr edit fails without read:org scope. ${longBody}\nEOF`,
		},
	})
	assert.equal(out, '', 'prose mentioning the command is prose, not a pull request body')
})

const signal = (name) => SIGNALS.find((s) => s.name === name)

test('unlanded-work fires on a branch with no upstream and stays quiet once pushed', () => {
	const dir = repo()
	assert.equal(signal('unlanded-work').detect({ cwd: dir }), null, 'a clean tree says nothing')

	fs.writeFileSync(path.join(dir, 'f.txt'), 'changed\n')
	git(dir, 'checkout', '-q', '-b', 'feat/x')
	const hit = signal('unlanded-work').detect({ cwd: dir })
	assert.match(hit.says, /1 modified file\(s\) are sitting on feat\/x, which has no upstream/)
	assert.equal(hit.key, 'feat/x:none')

	const bare = tmp('thiamine-remote-')
	git(bare, 'init', '--bare', '-b', 'main')
	git(dir, 'remote', 'add', 'origin', bare)
	git(dir, 'push', '-q', '-u', 'origin', 'feat/x')
	assert.equal(signal('unlanded-work').detect({ cwd: dir }), null, 'it has somewhere to land now')

	git(dir, 'push', '-q', 'origin', '--delete', 'feat/x')
	git(dir, 'fetch', '-q', '--prune', 'origin')
	assert.equal(signal('unlanded-work').detect({ cwd: dir }).key, 'feat/x:gone')
})

test('unlanded-work fires on a branch tracking the default branch, which is what worktree add -b leaves', () => {
	const dir = repo()
	const bare = tmp('thiamine-remote-')
	git(bare, 'init', '--bare', '-b', 'main')
	git(dir, 'remote', 'add', 'origin', bare)
	git(dir, 'push', '-q', '-u', 'origin', 'main')
	git(dir, 'remote', 'set-head', 'origin', 'main')

	// What `git worktree add -b feat/z <path> origin/main` configures.
	git(dir, 'checkout', '-q', '-b', 'feat/z', '--track', 'origin/main')
	fs.writeFileSync(path.join(dir, 'f.txt'), 'changed\n')

	const hit = signal('unlanded-work').detect({ cwd: dir })
	assert.equal(hit.key, 'feat/z:default')
	assert.match(hit.says, /tracks origin\/main rather than a branch of its own/)

	git(dir, 'push', '-q', '-u', 'origin', 'feat/z')
	assert.equal(signal('unlanded-work').detect({ cwd: dir }), null, 'now it has its own branch')
})

test('stale-handoff fires on a record naming a branch that is gone', () => {
	const dir = repo()
	fs.writeFileSync(
		path.join(dir, '.handoff-feat-retention.md'),
		'# work\n\nWhere: repo/tree/feat-retention, branch feat/retention at abc1234.\n',
	)
	assert.match(
		signal('stale-handoff').detect({ cwd: dir }).says,
		/feat\/retention, which no longer exists/,
	)

	git(dir, 'checkout', '-q', '-b', 'feat/retention')
	assert.equal(signal('stale-handoff').detect({ cwd: dir }), null, 'the branch is back')
})

test('triage-due fires when a watermark is past its cadence, and never on an unconfigured repo', () => {
	const dir = repo()
	assert.equal(signal('triage-due').detect({ cwd: dir }), null)

	const triage = path.join(dir, '.thiamine', 'triage')
	fs.mkdirSync(triage, { recursive: true })
	fs.writeFileSync(
		path.join(triage, 'sources.tsv'),
		'name\tkind\tlocator\tinterval\nsentry\terror-tracker\torg/api\tdaily\n',
	)
	assert.match(signal('triage-due').detect({ cwd: dir }).says, /never been swept/)

	const mark = path.join(triage, 'sentry.watermark')
	fs.writeFileSync(mark, '2026-09-01\n')
	assert.equal(signal('triage-due').detect({ cwd: dir }), null, 'swept just now')

	const old = Date.now() - 3 * 86_400_000
	fs.utimesSync(mark, old / 1000, old / 1000)
	assert.match(signal('triage-due').detect({ cwd: dir }).says, /3 day\(s\) ago/)
})

test('a signal needing a tool the machine lacks is absent, not broken', () => {
	const dir = repo()
	const saved = process.env.PATH
	try {
		process.env.PATH = '/nonexistent'
		for (const s of SIGNALS.filter((s) => (s.needs ?? []).includes('gh'))) {
			assert.equal(s.detect({ cwd: dir }), null, `${s.name} must not throw without gh`)
		}
	} finally {
		process.env.PATH = saved
	}
})

test('needs gates a signal before its detector runs', () => {
	const fake = (needs) => [
		{ name: 'fake', invoke: '/x', needs, detect: () => ({ key: 'k', says: 'fired' }) },
	]

	assert.equal(hasTool('thiamine-no-such-binary'), false)
	assert.equal(firstSignal({ cwd: '.' }, {}, fake(['thiamine-no-such-binary'])), null)
	assert.equal(firstSignal({ cwd: '.' }, {}, fake(['git']))?.says, 'fired')
})

test('a mistyped cooldown override falls back instead of silently switching the cooldown off', () => {
	const dir = repo()
	fs.writeFileSync(path.join(dir, 'f.txt'), 'changed\n')
	git(dir, 'checkout', '-q', '-b', 'feat/typo')
	const fired = { 'unlanded-work': { key: 'feat/typo:none', firedAtMs: Date.now() } }
	try {
		process.env.THIAMINE_SIGNAL_COOLDOWN_HOURS = 'twenty'
		assert.equal(firstSignal({ cwd: dir }, fired), null, 'still inside the default cooldown')
	} finally {
		delete process.env.THIAMINE_SIGNAL_COOLDOWN_HOURS
	}
})

test('firstSignal respects the cooldown for the same condition and speaks for a new one', () => {
	const dir = repo()
	fs.writeFileSync(path.join(dir, 'f.txt'), 'changed\n')
	git(dir, 'checkout', '-q', '-b', 'feat/y')

	const hit = firstSignal({ cwd: dir })
	assert.equal(hit.name, 'unlanded-work')

	const fired = { 'unlanded-work': { key: hit.key, firedAtMs: Date.now() } }
	assert.equal(firstSignal({ cwd: dir }, fired), null, 'same condition, inside the cooldown')

	const stale = { 'unlanded-work': { key: hit.key, firedAtMs: Date.now() - 21 * 3_600_000 } }
	assert.ok(firstSignal({ cwd: dir }, stale), 'the cooldown has expired')

	const other = { 'unlanded-work': { key: 'feat/z:none', firedAtMs: Date.now() } }
	assert.ok(firstSignal({ cwd: dir }, other), 'a different condition gets its own line')
})

test('firstSignal is silenced per signal and altogether by env', () => {
	const dir = repo()
	fs.writeFileSync(path.join(dir, 'f.txt'), 'changed\n')
	git(dir, 'checkout', '-q', '-b', 'feat/off')
	try {
		process.env.THIAMINE_SIGNAL_UNLANDED_WORK = '0'
		assert.equal(firstSignal({ cwd: dir })?.name, undefined, 'that one is off')
		delete process.env.THIAMINE_SIGNAL_UNLANDED_WORK
		process.env.THIAMINE_SIGNALS = '0'
		assert.equal(firstSignal({ cwd: dir }), null, 'all of them are off')
	} finally {
		delete process.env.THIAMINE_SIGNAL_UNLANDED_WORK
		delete process.env.THIAMINE_SIGNALS
	}
})

test('the suggest hook prints one line for a signal and records it', () => {
	const dir = repo()
	fs.writeFileSync(path.join(dir, 'f.txt'), 'changed\n')
	git(dir, 'checkout', '-q', '-b', 'feat/printed')
	const home = tmp('thiamine-home-')

	const out = runHook('session-start-suggest.mjs', { cwd: dir }, home)
	assert.match(out, /sitting on feat\/printed/)
	assert.match(out, /\/thiamine:branch-to-pr/)
	assert.equal(out.split('\n').length, 1, 'one line, whatever else is true')

	const again = runHook('session-start-suggest.mjs', { cwd: dir }, home)
	assert.equal(again, '', 'the same condition does not speak twice')
})

/** Asks one pass whether it is due, with nothing having run before unless the case says so. */
const due = (name, over) =>
	PASSES.find((p) => p.name === name).due({
		name,
		turns: 0,
		lastRunAtMs: 0,
		minutesSince: Infinity,
		...over,
	})

test('every pass declares a due measure and a slash command that exists', () => {
	for (const p of PASSES) {
		assert.equal(typeof p.due, 'function', `${p.name} has no due()`)
		assert.match(p.invoke, /^\/thiamine:[a-z-]+$/)
		assert.ok(fs.existsSync(path.join(HERE, '..', 'skills', p.invoke.split(':')[1], 'SKILL.md')))
	}
})

test('the mining passes still wait for turns and for elapsed time', () => {
	assert.equal(due('continual-learning', { turns: 9 }), null, 'under the turn bar')
	assert.match(due('continual-learning', { turns: 10 }).says, /10 turns/)
	assert.equal(
		due('continual-learning', { turns: 50, lastRunAtMs: Date.now(), minutesSince: 5 }),
		null,
		'it ran five minutes ago',
	)
})

test('capture-preferences waits for a body of work, not for a session', () => {
	assert.equal(due('capture-preferences', { turns: 40 }), null)
	assert.match(due('capture-preferences', { turns: 60 }).says, /how you work/)
})

test('maintain-skills counts commits, and is absent where there is nothing to audit', () => {
	const bare = repo()
	// Turns are banked well past every other pass's bar, to show this one does not count them.
	const audit = (over) => due('maintain-skills', { turns: 999, cwd: bare, ...over })
	assert.equal(audit(), null, 'a repo with no agent-facing context has no drift to find')

	fs.mkdirSync(path.join(bare, 'skills'))
	fs.writeFileSync(path.join(bare, 'skills', 'x.md'), 'x\n')
	for (let i = 0; i < 3; i++) git(bare, 'commit', '-q', '--allow-empty', '-m', `c${i}`)

	assert.equal(audit(), null, 'four commits is under the default bar')

	try {
		process.env.THIAMINE_MAINTAIN_SKILLS_MIN_COMMITS = '4'
		const hit = audit()
		assert.match(hit.says, /commits have landed and no pass has ever run here/)
		assert.ok(hit.overdue >= 1)
	} finally {
		delete process.env.THIAMINE_MAINTAIN_SKILLS_MIN_COMMITS
	}

	assert.equal(audit({ lastRunAtMs: Date.now(), minutesSince: 10 }), null, 'it ran ten minutes ago')
})

test('a pass whose measure throws does not take the session start down', () => {
	const out = runHook('session-start-suggest.mjs', { cwd: '/nonexistent-path-for-a-hook-test' })
	assert.equal(out, '')
})
