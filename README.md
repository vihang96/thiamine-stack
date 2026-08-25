# thiamine-stack

Engineering standards that survive AI-assisted development. Portable rules, review
skills, and authoring templates. The standard holds whether an agent or a human writes
the code.

Install in Claude Code:

```
/plugin marketplace add vihang96/thiamine-stack
/plugin install thiamine@thiamine-stack
```

To set up Codex, Cursor, the always-on rules, or a local checkout you intend to edit,
read [INSTALL.md](INSTALL.md), or tell an agent `use the thiamine-install skill`.

## Three commitments explain the rest

```
rules/RULES.md          the always-on standard, terse and harness-agnostic
rules/<id>.md           the rationale behind one rule, read on demand
skills/<name>/          SKILL.md, plus triggers.md recording when it should load
agents/<name>.md        delegated work whose output is small and whose input is not
hooks/                  Claude Code hooks, plus their handlers
lint/<language>/        lint rules that run in more than one linter
templates/              scaffolds for adding rules, skills, agents, and commands
scripts/new.mjs         scaffolds an artifact, links it, validates it
scripts/validate.mjs    validates every artifact, with no dependencies
.prettierrc             tabs, no semicolons, single quotes, 100 columns
.claude-plugin/         makes this repo a Claude Code plugin and marketplace
.cursor-plugin/         the same content under Cursor's manifest
```

**Plain markdown, no build step.** Rules and skills are portable by construction rather
than by compilation. There is no CLI, no generated output, and nothing to keep in sync.

**Installed by symlink.** Harnesses point at this repo, so one edit reaches all of them
at once. A copy exists only where a rule has to live inside another repo for CI, and
that copy is a fork.

**The agent is the installer.** Setup is a checklist, so it is a skill. Any capable
agent can install, extend, or audit this stack by reading the files in it.

## What the validator catches that prompting cannot

```sh
node scripts/validate.mjs           # errors fail, warnings inform
node scripts/validate.mjs --strict  # warnings fail too
```

Node standard library only, with nothing to install.

- **Missing dependencies.** A skill that says "apply the `foo` skill" when `foo` does not
  exist is the worst defect here. An agent does not error on it. It invents the missing
  contents and proceeds. Every referenced skill, agent, command, slash command, and file
  path has to resolve. A missing `requires:` entry fails, because the artifact cannot
  work without it. A missing `see_also:` entry only warns, so a general skill can name a
  specific one without depending on it.
- **Invocation contradictions.** A description that promises automatic triggering on a
  skill with `disable-model-invocation: true`, or one that claims to always apply when
  skill invocation is discretionary.
- **Overlapping artifacts.** Pairs of skills that share several identical examples. That
  is the cheapest signal that two standards have merged and may now disagree.
- **Unfilled templates.** Placeholder text that still matches a file in `templates/`, so
  a scaffolded artifact was never written.
- **Missing trigger examples.** Every skill needs a `triggers.md` holding prompts that
  must load it and near-misses that must not. Nothing else records that intent.
- Frontmatter, agreement between a name and its directory, thin descriptions, oversized
  bodies, rule ids, and version drift between `plugin.json` and `marketplace.json`.

To apply the same gate to hand-written changes, wire it into git once:

```sh
echo 'node scripts/validate.mjs' >> .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

Both scripts follow `.prettierrc`: tabs, no semicolons, single quotes. Tabs because
`technical-writing` says to indent code with tabs, and prettier's defaults disagreed
silently.

```sh
npx prettier --check scripts/    # or --write
```

### The lint layer

`lint/<language>/` holds the mechanically enforced half of a language standard. Today that
is `lint/typescript/`, 15 rules vendored from
[anti-slop](https://github.com/dmmulroy/anti-slop) under MIT, with their tests.

One plugin serves both Oxlint and ESLint. Rules are written with Oxlint's `createOnce`
API, and `eslintCompatPlugin` adds the ESLint-shaped `create` that delegates to it. The
same plugin file produces identical findings under both linters. Remove the wrapper and
ESLint throws while Oxlint keeps working, so it earns its place.

Every rule is syntactic, reading type annotations off the AST rather than resolved types.
Oxlint has no type-aware linting, so that constraint is what keeps one plugin portable.
The cost is real: a rule catches a written `: unknown` and misses a return only inferred
as unknown.

`skills/unslop-<language>/` names each rule in an Enforceable-by column, and the validator
fails if a skill claims a rule that is not in that language's directory. See
[lint/README.md](lint/README.md) to wire it into a repo.

Each language directory carries its own `package.json`, because the lint layer is the
only part of this repo with dependencies. The validator and the hooks import `node:`
builtins alone, so the core needs no install.

```sh
cd lint/typescript && npm install && npm test
```

### What the hooks do

Two hooks support the continual-learning loop, and neither one acts on its own.

The `Stop` hook counts completed turns and notes whether the transcript moved. It writes
nothing else and prints nothing, because a hook that talks during a task is the reason
people stop reading hooks. It returns immediately while `stop_hook_active` is set, which
is what Claude Code asks of a Stop hook.

The `SessionStart` hook reads that state. Once the turn count and the elapsed time both
pass their thresholds, it prints one line suggesting `/continual-learning`. It suggests
and nothing more. Override the thresholds with `THIAMINE_CL_MIN_TURNS` and
`THIAMINE_CL_MIN_MINUTES`, which default to 10 turns and 120 minutes.

State lives next to the memory it describes, in
`~/.claude/projects/<slug>/memory/.continual-learning.json`, so nothing is written into
your repo.

### Two checks static analysis cannot make

Static checks confirm that a description is well formed. They cannot confirm that it
fires.

**What the harness actually loaded.** Install the plugin, then run:

```sh
claude plugin details thiamine
```

That prints the component inventory and the projected token cost, which catches a valid
manifest whose skills Claude never picked up.

**Whether a skill fires on a real prompt.** `claude plugin eval` answers this. It runs
cases from `evals/`. Under `--ablation with-without` it scores the plugin against a
no-plugin baseline and reports the delta. Graders marked `with-only`, including
`tool_used: Skill`, act as a plugin-fired indicator, so a case can assert that a given
prompt loaded a given skill. `--threshold` exits 1, which makes it usable in CI.

The command is in early access and is not enabled on this account, so nothing here uses
it yet. `skills/<name>/triggers.md` holds the inputs in the meantime. They are a manual
rehearsal now and the raw material for eval cases later.

## Add to the stack

Scaffold an artifact, which copies the template, substitutes the name, symlinks new
skills into the other installed harnesses, and validates the result:

```sh
node scripts/new.mjs skill my-thing --standard   # or --procedure
node scripts/new.mjs rule my-rule
node scripts/new.mjs command my-command
node scripts/new.mjs agent my-agent
```

A skill requires an explicit `--standard` or `--procedure`. Picking the wrong shape is
the mistake that makes a skill unusable, so the flag forces the decision up front. Pass
`--no-link` to skip symlinks and `--force` to overwrite.

To have an agent do the whole thing, including choosing the artifact type:

```
use the thiamine-author skill to add a rule about swallowed exceptions
```

Read [templates/README.md](templates/README.md) for which template to reach for and
why. Copying one by hand still works, because nothing here requires the scripts.

## Status

Early. The install path, templates, authoring flow, and validator are in place. The rule
corpus in `rules/RULES.md` is seeded but not complete. `rules/scope.md` is the exemplar
for what an expanded rule looks like.

`node scripts/validate.mjs --strict` reports 0 errors and 0 warnings at this commit.
