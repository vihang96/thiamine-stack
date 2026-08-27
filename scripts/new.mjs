#!/usr/bin/env node
/**
 * Scaffold a thiamine artifact from its template, link it into the harnesses that
 * are installed, and validate the result.
 *
 *   node scripts/new.mjs skill <name> --standard | --procedure
 *   node scripts/new.mjs rule <id>
 *   node scripts/new.mjs command <name>
 *   node scripts/new.mjs agent <name>
 *
 * Flags:  --no-link  skip harness symlinks     --force  overwrite an existing file
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const NAME_PLACEHOLDER = /<kebab-case-(?:name|id)[^>]*>/g

// Skill dirs a harness writes to itself. A link here is silently clobbered on update.
const MANAGED = /managed|marker|\.system/

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const [kind, name] = args.filter((a) => !a.startsWith('--'))

const die = (msg, hint) => {
	console.error(`error: ${msg}`)
	if (hint) console.error(`  ${hint}`)
	process.exit(1)
}

const USAGE = [
	'usage:',
	'  node scripts/new.mjs skill <name> --standard | --procedure',
	'  node scripts/new.mjs rule <id>',
	'  node scripts/new.mjs command <name>',
	'  node scripts/new.mjs agent <name>',
].join('\n')

if (!kind || !name) die('need a type and a name', USAGE)
if (!KEBAB.test(name)) die(`'${name}' is not kebab-case`, 'use lowercase words joined by hyphens')

// ---------------------------------------------------------------- resolve target
let template, target

if (kind === 'skill') {
	const standard = flags.has('--standard')
	const procedure = flags.has('--procedure')
	if (standard === procedure) {
		die(
			'a skill needs exactly one shape: --standard or --procedure',
			'--standard judges something (criteria, worked example, review checklist).\n' +
				'  --procedure does something (ordered steps, ending in verification).\n' +
				'  The tell: time-ordered sections mean procedure; groups of criteria mean standard.',
		)
	}
	template = `templates/skill/${standard ? 'standard' : 'procedure'}.SKILL.md`
	target = `skills/${name}/SKILL.md`
} else if (kind === 'rule') {
	template = 'templates/rule/RULE.md.template'
	target = `rules/why/${name}.md`
} else if (kind === 'command') {
	template = 'templates/command/COMMAND.md.template'
	target = `commands/${name}.md`
} else if (kind === 'agent') {
	template = 'templates/agent/AGENT.md.template'
	target = `agents/${name}.md`
} else {
	die(`unknown type '${kind}'`, USAGE)
}

const templatePath = path.join(ROOT, template)
const targetPath = path.join(ROOT, target)

if (!fs.existsSync(templatePath)) die(`template ${template} is missing`, 'the repo is incomplete')
if (fs.existsSync(targetPath) && !flags.has('--force')) {
	die(`${target} already exists`, 'edit it, pick another name, or pass --force')
}

// ---------------------------------------------------------------- write
fs.mkdirSync(path.dirname(targetPath), { recursive: true })
const fill = (rel) =>
	fs.readFileSync(path.join(ROOT, rel), 'utf8').replaceAll(NAME_PLACEHOLDER, name)
fs.writeFileSync(targetPath, fill(template))
console.log(`created ${target}  (from ${template})`)

// A skill without recorded triggers has nothing testing whether it ever loads.
if (kind === 'skill') {
	const triggers = path.join(path.dirname(targetPath), 'triggers.md')
	if (!fs.existsSync(triggers) || flags.has('--force')) {
		fs.writeFileSync(triggers, fill('templates/skill/triggers.md').replaceAll('<skill-name>', name))
		console.log(`created skills/${name}/triggers.md  (from templates/skill/triggers.md)`)
	}
}

// ---------------------------------------------------------------- link
const linked = []
if (kind === 'skill' && !flags.has('--no-link')) {
	for (const dir of [
		path.join(os.homedir(), '.codex/skills'),
		path.join(os.homedir(), '.cursor/skills'),
	]) {
		if (!fs.existsSync(dir)) continue
		if (fs.readdirSync(dir).some((f) => MANAGED.test(f))) {
			console.log(`skipped ${dir}  (harness-managed; links here get overwritten)`)
			continue
		}
		const link = path.join(dir, name)
		fs.rmSync(link, { force: true, recursive: false })
		fs.symlinkSync(path.join(ROOT, 'skills', name), link)
		linked.push(link)
	}
	for (const l of linked) console.log(`linked  ${l}`)
	if (!linked.length) console.log('no other harness skill dirs found; Claude Code needs no link')
}

// ---------------------------------------------------------------- next steps
console.log(`\nnext:`)
console.log(`  1. write it — the description decides whether the agent ever loads it`)
if (kind === 'skill') {
	console.log(`     then fill in triggers.md: prompts that must load it, near-misses that must not`)
}
if (kind === 'rule') {
	console.log(`  2. add a one-line entry for '${name}' under the right heading in rules/RULES.md`)
	console.log(`     the detail file is only read on demand, so that line must stand alone`)
} else {
	console.log(`  2. declare anything it depends on:  requires: [other-skill]`)
}
console.log(`  3. node scripts/validate.mjs\n`)

// ---------------------------------------------------------------- validate
try {
	execFileSync('node', [path.join(ROOT, 'scripts/validate.mjs')], {
		stdio: 'inherit',
	})
} catch {
	console.log('\nvalidator reported errors, which is expected until you fill the template in')
}
