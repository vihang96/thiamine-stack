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
