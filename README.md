# thiamine-stack

Engineering standards that survive AI-assisted development. Portable rules, review
skills, and authoring templates — designed so the standard holds whether an agent or
a human is writing the code.

Install in Claude Code:

```
/plugin marketplace add vihang96/thiamine-stack
/plugin install thiamine@thiamine-stack
```

For Codex, Cursor, the always-on rules, or a local checkout you intend to edit, see
[INSTALL.md](INSTALL.md), or tell an agent `use the thiamine-install skill`.

## How it is put together

```
rules/RULES.md          the always-on standard — terse, harness-agnostic markdown
rules/<id>.md           the rationale behind one rule, read on demand
skills/<name>/          SKILL.md, plus triggers.md recording when it should load
templates/              scaffolds for adding rules, skills, agents, commands
.prettierrc             tabs, no semicolons, single quotes, 100 cols
scripts/new.mjs         scaffolds an artifact, links it, validates it
scripts/validate.mjs    validates every artifact; no dependencies
.claude-plugin/         makes this repo a Claude Code plugin + marketplace
.cursor-plugin/         same content, Cursor's manifest
```

Three design commitments, because they explain everything else:

**Plain markdown, no build step.** Rules and skills are portable by construction, not
by compilation. There is no CLI, no generated output, nothing to keep in sync.

**Installed by symlink.** Harnesses point at this repo. One edit propagates to all of
them instantly. Copies are only for the case where a rule must live inside another
repo for CI, and that copy is explicitly a fork.

**The agent is the installer.** Setup is a checklist, so it is a skill. Any capable
agent can install, extend, or audit this stack by reading files in it.

## Adding an artifact

```sh
node scripts/new.mjs skill my-thing --standard   # or --procedure
node scripts/new.mjs rule my-rule
node scripts/new.mjs command my-command
node scripts/new.mjs agent my-agent
```

It copies the right template, substitutes the name, symlinks new skills into whichever
other harnesses are installed, and runs the validator. Skills require an explicit
`--standard` or `--procedure`, because picking the wrong shape is the mistake that
makes a skill unusable and the flag forces the decision up front.

Flags: `--no-link` to skip symlinks, `--force` to overwrite.

## Checking it

```sh
node scripts/validate.mjs           # errors fail, warnings inform
node scripts/validate.mjs --strict  # warnings fail too
```

Stdlib only, no install. It catches the defects that prompting does not:

- **Missing dependencies.** A skill that says "apply the `foo` skill" when `foo` does
  not exist is the worst defect here, because an agent does not error on it — it
  invents the missing contents and proceeds. Every referenced skill, agent, command,
  slash command, and file path has to resolve. `requires:` is a hard dependency and a
  missing one fails; `see_also:` is a peer cross-reference and a missing one only warns,
  so a general skill can name a specific one without depending on it.
- **Invocation contradictions.** A description promising automatic triggering on a
  skill with `disable-model-invocation: true`, or one claiming to "always apply" when
  skill invocation is discretionary.
- **Overlapping artifacts.** Pairs of skills sharing several identical examples, which
  is the cheapest signal that two standards have merged and may now disagree.
- **Unfilled templates.** Placeholder text that still matches a file in `templates/`,
  so a scaffolded artifact was never actually written.
- **Missing trigger examples.** Every skill needs a `triggers.md` with prompts that must
  load it and near-misses that must not, since nothing else records that intent.
- Frontmatter, name/directory agreement, thin descriptions, oversized bodies, rule ids,
  manifest version drift between `plugin.json` and `marketplace.json`.

Both scripts are formatted by `.prettierrc` — tabs, no semicolons, single quotes. Tabs
because `technical-writing` says to indent code with tabs, and prettier's defaults
silently disagreed:

```sh
npx prettier --check scripts/    # or --write
```

### The two layers this does not cover

Static checks confirm a description is well formed. They cannot confirm it *fires*.

**What the harness actually loaded.** Install the plugin, then:

```sh
claude plugin details thiamine
```

That prints the component inventory and projected token cost, which catches a valid
manifest whose skills Claude never picked up.

**Whether a skill fires on a real prompt.** `claude plugin eval` is the tool for this.
It runs cases from `evals/`, and with `--ablation with-without` it scores the plugin
against a no-plugin baseline and reports the delta. Graders marked `with-only`,
including `tool_used: Skill`, act as a plugin-fired indicator, so a case can assert that
a given prompt loaded a given skill. `--threshold` exits 1, so it belongs in CI.

It is in early access and not enabled on this account, so nothing here uses it yet.
`skills/<name>/triggers.md` holds the inputs in the meantime: a manual rehearsal now,
and the raw material for eval cases when access lands.

Wire the validator into git once and it applies to hand-written changes too:

```sh
echo 'node scripts/validate.mjs' >> .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

## Adding to it

```
use the thiamine-author skill to add a rule about <x>
```

It picks the artifact type, writes from the template, and registers it. Or copy from
`templates/` by hand — see [templates/README.md](templates/README.md) for which to use
and why. Nothing here requires tooling.

## Status

Early. The install path, templates, authoring flow, and validator are in place. The
rule corpus in `rules/RULES.md` is seeded but not complete — `rules/scope.md` is the
exemplar for what an expanded rule should look like.

`node scripts/validate.mjs` currently reports 0 errors and 6 warnings, all of them
real: `unslop-prose` declares itself always-applicable but is shaped as a skill, and it
overlaps `technical-writing` on six shared examples without either naming an owner.
