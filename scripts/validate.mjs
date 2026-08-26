#!/usr/bin/env node
/**
 * Validate thiamine artifacts: frontmatter, dependencies, and coverage overlap.
 *
 * Run from anywhere:  node scripts/validate.mjs [--strict]
 *
 * Errors mean an artifact is broken and a harness will misbehave. Warnings mean it
 * will load but probably not do what the author intended. --strict fails on both.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const MAX_LINES = 500
const MIN_DESC = 80
const SHARED_EXAMPLE_LIMIT = 3
const MIN_SHOULD_FIRE = 3
const MIN_SHOULD_NOT_FIRE = 2
const MIN_EXAMPLE_LEN = 6 // tuned against the technical-writing / unslop-prose overlap

const errors = []
const warnings = []

const err = (where, msg, fix) => errors.push({ where, msg, fix })
const warn = (where, msg, fix) => warnings.push({ where, msg, fix })

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const exists = (...parts) => fs.existsSync(path.join(...parts))
const isDir = (...parts) => {
	const p = path.join(...parts)
	return fs.existsSync(p) && fs.statSync(p).isDirectory()
}
const listdir = (rel) => (isDir(ROOT, rel) ? fs.readdirSync(path.join(ROOT, rel)).sort() : [])

const trimQuotes = (s) => s.trim().replace(/^["']|["']$/g, '')

/** Return [frontmatter, body]. Values stay strings; lists are parsed from [a, b] form. */
function frontmatter(text) {
	const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
	if (!m) return [null, text]
	const fm = {}
	for (const [, key, raw] of m[1].matchAll(/^([\w-]+):\s*(.*)$/gm)) {
		const val = trimQuotes(raw)
		fm[key] =
			val.startsWith('[') && val.endsWith(']')
				? val.slice(1, -1).split(',').map(trimQuotes).filter(Boolean)
				: val
	}
	return [fm, m[2]]
}

/** Declared deps may be absent, a bare string, or a list. */
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : [])

// ---------------------------------------------------------------- inventory
const skillNames = listdir('skills').filter((d) => isDir(ROOT, 'skills', d))
const ruleIds = listdir('rules')
	.filter((f) => f.endsWith('.md') && f !== 'RULES.md')
	.map((f) => f.slice(0, -3))
const commandNames = listdir('commands')
	.filter((f) => f.endsWith('.md'))
	.map((f) => f.slice(0, -3))
const agentNames = listdir('agents')
	.filter((f) => f.endsWith('.md'))
	.map((f) => f.slice(0, -3))
const known = new Set([...skillNames, ...ruleIds, ...commandNames, ...agentNames])

// ---------------------------------------------------------------- dependencies
const DEP_PATTERNS = [
	// "apply the **unslop-prose** skill", "see the foo skill"
	/(?:apply|use|see|invoke|run|via)\s+(?:the\s+)?[`*_]*([a-z][a-z0-9-]{2,})[`*_]*\s+(?:skill|agent|command|rule)\b/gi,
	// "the **unslop-prose** skill owns ..."
	/[`*_]{1,2}([a-z][a-z0-9-]{2,})[`*_]{1,2}\s+(?:skill|agent|command)\b/g,
]
const POSSESSIVE = /`([a-z][a-z0-9-]{2,})`'s\s+\w+\s+(?:rule|skill|section|catalog)/g
const SLASH_REF = /(?<=^|[\s`("'])\/([a-z][a-z0-9-]{2,})\b/gm
const PATH_REF = /`([\w./-]*[\w-]+\/[\w./-]+\.(?:md|sh|py|mjs|json|ya?ml))`/g

const SLASH_ALLOW = new Set([
	'plugin',
	'skills',
	'commands',
	'agents',
	'rules',
	'references',
	'scripts',
	'usr',
	'tmp',
	'etc',
	'home',
	// placeholders that appear in templates and explanatory prose
	'name',
	'your-name',
	'skill-name',
	'shortcut',
	'command',
	'id',
])

// Determiners and placeholders that the dependency patterns pick up from ordinary
// prose ("apply another skill", "the matching command"). Not artifact names.
const GENERIC = new Set(
	`
this that the a an and one two each any all every other another some such no its their
same matching right wrong new own real whole first second sibling missing given related
kind type name shape thing artifact skill agent command rule detail payload trigger
`
		.trim()
		.split(/\s+/),
)

// Top-level directories of this repo, plus the conventional subdirectories of a skill.
// A referenced path outside both is a runtime path, not a broken repo pointer.
const REPO_DIRS = new Set(
	fs
		.readdirSync(ROOT, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => e.name),
)
const SKILL_LOCAL_DIRS = new Set(['references', 'playbooks', 'scripts', 'assets'])

const CODEISH = /[/._(){}<>=]|^--|^\\$/

const PLACEHOLDER = /<[^>\n]{4,}>/g

// Template prose reads "<Title>" or "<One paragraph: ...>". Lowercase single words
// like <name> and <id> are usage notation, not something an author forgot to fill in.
const isStubText = (s) => /\s/.test(s) || /^<(?:[A-Z]|kebab-case-)/.test(s)

/**
 * Placeholder text that appears verbatim in a template, so an artifact carrying it
 * was scaffolded and never filled in. Comparing against the templates rather than
 * matching angle brackets keeps deliberate notation like <absolute path to $X> clean.
 */
const templateStubs = (() => {
	const found = new Set()
	const walk = (dir) => {
		if (!fs.existsSync(dir)) return
		for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
			const p = path.join(dir, e.name)
			if (e.isDirectory()) walk(p)
			else if (e.name.endsWith('.md') || e.name.endsWith('.template')) {
				for (const m of fs.readFileSync(p, 'utf8').match(PLACEHOLDER) || []) {
					if (isStubText(m)) found.add(m)
				}
			}
		}
	}
	walk(path.join(ROOT, 'templates'))
	return found
})()

/**
 * Keep prose examples; drop paths, filenames, flags, and code identifiers.
 * Shared directory names like `rules/` are not evidence that two skills overlap.
 */
const isProse = (token) => !CODEISH.test(token)

/**
 * Keep tokens distinctive enough that sharing one means something.
 *
 * Two standards both having an Enforceable-by column makes them share the word "review",
 * and both naming a sibling makes them share its name. Neither is evidence that their
 * guidance has merged, so drop fragments, artifact names, and short single words.
 */
function isDistinctive(token) {
	if (!/^[a-z]/.test(token)) return false
	if (known.has(token)) return false
	return token.includes(' ') || token.length >= 7
}

const captures = (body, re) => new Set([...body.matchAll(re)].map((m) => m[1]))

/**
 * A skill's triggers.md records prompts that must load it and near-misses that must
 * not. Static checks cannot tell whether a description actually fires; these are the
 * inputs that answer that, by hand now and via `claude plugin eval` once it is
 * generally available.
 */
function checkTriggers(name, file) {
	const rel = `skills/${name}/triggers.md`
	if (!fs.existsSync(file)) {
		warn(
			rel,
			'no triggers.md, so nothing records when this skill should load',
			'add it from templates/skill/triggers.md, or run scripts/new.mjs to scaffold one',
		)
		return
	}
	const text = fs.readFileSync(file, 'utf8')

	// Split on h2 boundaries rather than matching each section with a lookahead. JS has
	// no \Z anchor, so a lookahead for "next heading or end of input" silently fails on
	// whichever section happens to come last.
	const sections = new Map()
	let current = null
	for (const line of text.split('\n')) {
		const heading = line.match(/^##\s+(.*?)\s*$/)
		if (heading) {
			current = heading[1].toLowerCase()
			sections.set(current, [])
		} else if (current && line.trim().startsWith('- ')) {
			sections.get(current).push(line.replace(/^\s*-\s+/, '').trim())
		}
	}
	const section = (heading) => sections.get(heading.toLowerCase()) ?? null

	for (const [heading, min] of [
		['Should fire', MIN_SHOULD_FIRE],
		['Should not fire', MIN_SHOULD_NOT_FIRE],
	]) {
		const items = section(heading)
		if (items === null) {
			warn(
				rel,
				`no "## ${heading}" section`,
				'both sections are needed; a skill with no near-misses is untested against over-firing',
			)
			continue
		}
		if (items.length < min) {
			warn(
				rel,
				`only ${items.length} "${heading}" example(s), want at least ${min}`,
				'one example proves nothing about where the boundary is',
			)
		}
		// A single word is a topic, not something anyone types. Anything longer is a
		// judgement call the author gets to make.
		for (const item of items.filter((i) => i.split(/\s+/).length < 2)) {
			warn(
				rel,
				`"${item}" is a single word, not a prompt`,
				'write it as you would actually type it',
			)
		}
	}

	for (const stub of text.match(PLACEHOLDER) || []) {
		if (templateStubs.has(stub)) {
			warn(
				rel,
				'still contains unfilled template placeholders',
				`replace or delete them, e.g. ${stub}`,
			)
			break
		}
	}
}

/** Flag references to artifacts and files that do not exist. */
/**
 * `requires` is a hard dependency: the artifact does not work without it, so a missing
 * one is an error. `see_also` is a cross-reference, usually a scope boundary between
 * peers; the artifact still works alone, so a missing one is only a warning. Keeping
 * them separate is what lets a lower-level skill name a higher-level one without
 * depending on it.
 */
function checkDeps(where, body, declared, skillDir, soft = []) {
	for (const dep of declared) {
		if (!known.has(dep)) {
			err(
				where,
				`declared dependency '${dep}' does not exist`,
				`create it, or remove it from requires:. known: ${[...known].sort().join(', ')}`,
			)
		}
	}

	for (const ref of soft) {
		if (!known.has(ref)) {
			warn(
				where,
				`see_also cross-reference '${ref}' does not exist`,
				'this is not fatal, since see_also is optional. Point it somewhere real or drop it.',
			)
		}
	}

	const found = new Set()
	for (const pat of DEP_PATTERNS) {
		for (const name of captures(body, pat)) found.add(name.toLowerCase())
	}
	for (const name of [...found].filter((n) => !GENERIC.has(n)).sort()) {
		// A name the author declared optional is already covered by the see_also warning.
		// Erroring again would make a soft cross-reference behave like a hard dependency.
		if (soft.includes(name)) continue
		if (!known.has(name)) {
			err(
				where,
				`references a '${name}' skill/agent/command that does not exist`,
				'create it, or drop the reference. An agent told to apply a missing skill will invent its contents.',
			)
		} else if (!declared.includes(name) && !soft.includes(name)) {
			warn(
				where,
				`references '${name}' but declares it in neither requires: nor see_also:`,
				`add  requires: [${name}]  if it cannot work without it, or  see_also: [${name}]  if it is a peer`,
			)
		}
	}

	for (const name of captures(body, POSSESSIVE)) {
		if (!known.has(name.toLowerCase())) {
			warn(
				where,
				`refers to \`${name}\`'s contents, but no such artifact exists`,
				'point at something real, or describe the contents inline',
			)
		}
	}

	for (const name of captures(body, SLASH_REF)) {
		if (SLASH_ALLOW.has(name) || known.has(name)) continue
		warn(
			where,
			`mentions slash command /${name}, which is not in commands/ or skills/`,
			'a slash reference only resolves if a command or skill of that name exists',
		)
	}

	for (const rel of captures(body, PATH_REF)) {
		if (rel.startsWith('http') || rel.startsWith('~') || rel.includes('<')) continue
		const bases = skillDir ? [skillDir, ROOT] : [ROOT]
		if (bases.some((b) => exists(b, rel))) continue
		// A path only has to exist when it names something in this repo. An artifact may
		// also name a runtime path it creates elsewhere, such as a harness memory store,
		// and those are not this validator's business.
		const first = rel.split('/')[0]
		if (!REPO_DIRS.has(first) && !SKILL_LOCAL_DIRS.has(first)) continue
		{
			err(
				where,
				`points at file \`${rel}\`, which does not exist`,
				'create the file or remove the pointer',
			)
		}
	}
}

// ---------------------------------------------------------------- skills
const examplesBySkill = new Map()
const skillMeta = new Map()

for (const name of skillNames) {
	const rel = `skills/${name}/SKILL.md`
	if (!exists(ROOT, rel)) {
		err(`skills/${name}/`, 'directory has no SKILL.md', 'add SKILL.md or delete the directory')
		continue
	}

	const [fm, body] = frontmatter(read(rel))
	if (fm === null) {
		err(rel, 'no YAML frontmatter', 'the file must open with --- name: ... description: ... ---')
		continue
	}

	if (fm.name !== name) {
		err(
			rel,
			`frontmatter name '${fm.name}' does not match directory '${name}'`,
			`set  name: ${name}`,
		)
	}
	if (!KEBAB.test(name)) {
		err(rel, `'${name}' is not kebab-case`, 'rename to lowercase words joined by hyphens')
	}

	const desc = fm.description || ''
	const invocable = String(fm['disable-model-invocation'] || '').toLowerCase() !== 'true'
	if (!desc) {
		err(
			rel,
			'no description',
			'the agent sees only name + description when deciding to load a skill',
		)
	} else if (desc.length < MIN_DESC) {
		warn(
			rel,
			`description is ${desc.length} chars, likely too thin to route on`,
			'name the concrete situations that should trigger it, in third person',
		)
	}

	const triggerish = /\buse (?:when|for|before|after)\b|\bwhen \w+ing\b/i.test(desc)
	if (invocable && desc && !triggerish) {
		warn(
			rel,
			'description names no trigger condition',
			'add "Use when ..." naming situations the agent can recognize',
		)
	}
	// "Use when asked to X" is accurate for a slash-only skill, because the user asks.
	// Only a description implying the agent decides contradicts the flag.
	const manual = /\basked\b|\bon request\b|\byou (?:type|invoke|run)\b/i.test(desc)
	if (!invocable && triggerish && !manual) {
		warn(
			rel,
			'disable-model-invocation is set, but the description promises automatic triggering',
			'either drop the flag, or cut the description to how the skill is actually reached',
		)
	}
	if (/\b(must )?always (apply|be applied|applies)\b/i.test(desc)) {
		warn(
			rel,
			'description says it always applies, but skill invocation is discretionary',
			'put a one-line always-on entry in rules/RULES.md that routes here, or state real triggers',
		)
	}

	const lines = (body.match(/\n/g) || []).length
	if (lines > MAX_LINES) {
		warn(
			rel,
			`${lines} lines of body loaded in full whenever the skill fires`,
			'move situational detail into references/ and say when to read it',
		)
	}

	checkTriggers(name, path.join(ROOT, 'skills', name, 'triggers.md'))

	const stubs = new Set(
		[...(desc.match(PLACEHOLDER) || []), ...(body.match(PLACEHOLDER) || [])].filter((s) =>
			templateStubs.has(s),
		),
	)
	if (stubs.size) {
		warn(
			rel,
			`${stubs.size} unfilled template placeholder(s) remain`,
			`fill them in or delete them, e.g. ${[...stubs].slice(0, 2).join('  ')}`,
		)
	}

	const declared = asList(fm.requires)
	const soft = asList(fm.see_also)
	checkDeps(rel, body, declared, path.join(ROOT, 'skills', name), soft)

	// distinctive quoted or backticked examples, used for the overlap check below
	const quoted = new RegExp(`"([^"\\n]{${MIN_EXAMPLE_LEN},80})"`, 'g')
	const coded = new RegExp('`([^`\\n]{' + MIN_EXAMPLE_LEN + ',80})`', 'g')
	const ex = new Set([...captures(body, quoted), ...captures(body, coded)])
	const cleaned = [...ex]
		.map((e) => e.trim().toLowerCase())
		.filter(isProse)
		.filter(isDistinctive)
	examplesBySkill.set(name, new Set(cleaned))
	skillMeta.set(name, { owns: fm.owns, body, links: [...declared, ...soft] })
}

// ---------------------------------------------------------------- overlap
for (let i = 0; i < skillNames.length; i++) {
	for (let j = i + 1; j < skillNames.length; j++) {
		const [a, b] = [skillNames[i], skillNames[j]]
		const other = examplesBySkill.get(b) || new Set()
		const shared = [...(examplesBySkill.get(a) || [])].filter((e) => other.has(e)).sort()
		if (shared.length < SHARED_EXAMPLE_LIMIT) continue
		// Overlap is only a defect while it is undeclared. Two skills that both state an
		// owns: territory and name each other have drawn the boundary on purpose.
		const [ma, mb] = [skillMeta.get(a), skillMeta.get(b)]
		const linked = (m, other) => m?.links.includes(other) || m?.body.includes(other)
		if (ma?.owns && mb?.owns && linked(ma, b) && linked(mb, a)) continue
		warn(
			`skills/${a} + skills/${b}`,
			`${shared.length} identical examples appear in both skills`,
			'state in each which one is authoritative, or move the shared material to one of them. ' +
				`Overlapping guidance lets an agent satisfy the weaker version. Examples: [${shared
					.slice(0, 3)
					.map((e) => `'${e}'`)
					.join(', ')}]`,
		)
	}
}

// ---------------------------------------------------------------- rules
if (exists(ROOT, 'rules/RULES.md')) {
	for (const rid of ruleIds) {
		const [fm, body] = frontmatter(read(`rules/${rid}.md`))
		if (fm === null) {
			warn(`rules/${rid}.md`, 'no frontmatter', 'add id, summary, and enforced_by')
			continue
		}
		if (fm.id !== rid) {
			err(`rules/${rid}.md`, `id '${fm.id}' does not match filename '${rid}'`, `set  id: ${rid}`)
		}
		if (!fm.enforced_by) {
			warn(
				`rules/${rid}.md`,
				'no enforced_by',
				'name the linter, hook, or review step that catches violations',
			)
		}
		checkDeps(`rules/${rid}.md`, body, asList(fm.requires), null, asList(fm.see_also))
	}
} else {
	err('rules/RULES.md', 'missing', 'this file is the always-on standard every harness points at')
}

// ---------------------------------------------------------------- agents, commands
for (const [kind, names] of [
	['agents', agentNames],
	['commands', commandNames],
]) {
	for (const n of names) {
		const rel = `${kind}/${n}.md`
		const [fm, body] = frontmatter(read(rel))
		if (fm === null) {
			err(rel, 'no frontmatter', 'add description (and name, for agents)')
			continue
		}
		if (kind === 'agents' && fm.name !== n) {
			err(rel, `name '${fm.name}' does not match filename '${n}'`, `set  name: ${n}`)
		}
		if (!fm.description) {
			err(rel, 'no description', 'this is the only text shown when choosing whether to use it')
		}
		checkDeps(rel, body, asList(fm.requires), null, asList(fm.see_also))
	}
}

// ---------------------------------------------------------------- lint rule claims
// A skill that names a lint in an Enforceable-by column claims something mechanical backs
// that criterion. If the lint is not there, the claim is false and the criterion is
// review-only without saying so. How a language declares its lints differs, so each
// contributes both the names it has and the shape of a citation.
const lintLanguages = new Map()

for (const language of listdir('lint')) {
	if (!isDir(ROOT, 'lint', language)) continue

	// Authored rules, one file per rule.
	if (isDir(ROOT, 'lint', language, 'rules')) {
		lintLanguages.set(language, {
			names: new Set(
				listdir(`lint/${language}/rules`)
					.filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
					.map((f) => f.replace(/\.ts$/, '')),
			),
			ref: /`((?:no|require|prefer)-[a-z0-9-]+)`/g,
			where: `lint/${language}/rules/`,
		})
		continue
	}

	// Configured lints from an existing linter, listed in a generated snapshot. The
	// namespaces come from the snapshot itself, so a new language needs no code here.
	const snapshot = `lint/${language}/lints-available.txt`
	if (exists(ROOT, snapshot)) {
		const names = new Set(
			read(snapshot)
				.split('\n')
				.filter((l) => l && !l.startsWith('#'))
				.map((l) => l.trim()),
		)
		const namespaces = [...new Set([...names].map((n) => n.split('::')[0]))].sort()
		if (!namespaces.length) continue
		lintLanguages.set(language, {
			names,
			ref: new RegExp('`((?:' + namespaces.join('|') + ')::[A-Za-z0-9_]+)`', 'g'),
			where: snapshot,
			stale: true,
		})
	}
}

for (const name of skillNames) {
	const rel = `skills/${name}/SKILL.md`
	if (!exists(ROOT, rel)) continue

	// A skill named for a language is held to that language's lints, so a Rust skill
	// cannot satisfy a claim with a TypeScript rule.
	const language = [...lintLanguages.keys()].find((l) => name.endsWith(`-${l}`) || name === l)
	if (!language) continue
	const { names, ref, where, stale } = lintLanguages.get(language)

	for (const cited of captures(read(rel), ref)) {
		if (names.has(cited)) continue
		err(
			rel,
			`claims lint \`${cited}\`, which is not in ${where}`,
			stale
				? 'either the lint does not exist, or the snapshot predates it. Run scripts/regen-lints.sh.'
				: `add lint/${language}/rules/${cited}.ts, or change the Enforceable-by entry to review`,
		)
	}
}

// ---------------------------------------------------------------- hooks
// A hooks.json that names a handler which is not there fails at runtime, inside a hook,
// where the error is easy to miss. Check the paths instead.
if (exists(ROOT, 'hooks/hooks.json')) {
	try {
		const cfg = JSON.parse(read('hooks/hooks.json'))
		const events = Object.entries(cfg.hooks ?? {})
		if (!events.length) {
			warn('hooks/hooks.json', 'declares no hooks', 'delete the file or add an event')
		}
		for (const [event, matchers] of events) {
			for (const m of matchers) {
				for (const h of m.hooks ?? []) {
					const cmd = h.command ?? ''
					for (const rel of cmd.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([\w./-]+)/g)) {
						if (!exists(ROOT, rel[1])) {
							err(
								'hooks/hooks.json',
								`${event} hook runs \`${rel[1]}\`, which does not exist`,
								'create the handler or remove the hook',
							)
						}
					}
					if (cmd.startsWith('bun ')) {
						warn(
							'hooks/hooks.json',
							`${event} hook runs bun, which users may not have`,
							'use node, which this repo already depends on',
						)
					}
					if (!h.timeout) {
						warn(
							'hooks/hooks.json',
							`${event} hook has no timeout`,
							'a hook without a timeout can hang a session',
						)
					}
				}
			}
		}
	} catch (e) {
		err('hooks/hooks.json', `invalid JSON: ${e.message}`, 'a broken hooks file disables every hook')
	}
}

// ---------------------------------------------------------------- manifests
function loadJson(rel) {
	if (!exists(ROOT, rel)) return null
	try {
		return JSON.parse(read(rel))
	} catch (e) {
		err(
			rel,
			`invalid JSON: ${e.message}`,
			'fix the syntax; a broken manifest makes the whole plugin unloadable',
		)
		return null
	}
}

const plugin = loadJson('.claude-plugin/plugin.json')
const market = loadJson('.claude-plugin/marketplace.json')

if (plugin) {
	for (const field of ['name', 'version', 'description']) {
		if (!plugin[field]) {
			err('.claude-plugin/plugin.json', `missing '${field}'`, 'required for the plugin to install')
		}
	}
}

if (plugin && market) {
	for (const entry of market.plugins || []) {
		if (entry.name === plugin.name && entry.version !== plugin.version) {
			err(
				'.claude-plugin/marketplace.json',
				`version ${entry.version} disagrees with plugin.json ${plugin.version}`,
				'bump both together; the mismatch silently serves a stale plugin',
			)
		}
	}
}

for (const rel of ['.cursor-plugin/plugin.json']) {
	const man = loadJson(rel)
	if (!man) continue
	for (const key of ['skills', 'agents', 'commands']) {
		const d = man[key]
		if (d && !isDir(ROOT, d)) {
			err(
				rel,
				`declares ${key}: '${d}', which is not a directory`,
				`create ${d}/ or remove the key`,
			)
		}
	}
}

// ---------------------------------------------------------------- report
const show = (label, items) => {
	for (const { where, msg, fix } of items) {
		console.log(`${label} ${where}\n    ${msg}`)
		if (fix) console.log(`    fix: ${fix}`)
	}
}

show('ERROR', errors)
if (errors.length && warnings.length) console.log()
show('WARN ', warnings)

const counted = `${skillNames.length} skills, ${ruleIds.length} rules, ${agentNames.length} agents, ${commandNames.length} commands`
console.log(`\n${counted}: ${errors.length} errors, ${warnings.length} warnings`)

const strict = process.argv.includes('--strict')
process.exit(errors.length || (strict && warnings.length) ? 1 : 0)
