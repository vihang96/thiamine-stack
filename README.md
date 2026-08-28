# Thiamine Stack

<p align="center">
  <img src="assets/thiamine-tablet.webp" alt="A vitamin tablet fizzing in a glass of water, bubbles streaming upward" width="360">
</p>

Thiamine is the vitamin whose absence does quiet, cumulative damage. You take it before
anything goes wrong, and it is cheap.

This is the same idea for AI-written code. A set of standards, skills, and checks that
coding agents load automatically, so what they produce holds up without a person reading
every line.

The point is not to slow agents down. It is to run more of them at once and trust the
output, so human attention goes to the outcome and the experience rather than to
line-by-line review.

Underneath all of it is one habit. Take the problem apart before accepting how it was
framed, and decide from what is true rather than from what was asked for.

## Install

In Claude Code:

```
/plugin marketplace add vihang96/thiamine-stack
/plugin install thiamine@thiamine-stack
```

For Codex, Cursor, the always-on rules, or a local checkout you intend to edit, read
[INSTALL.md](INSTALL.md), or tell an agent `use the thiamine-install skill`.

## How it works

Three layers, and they load differently.

**Rules** are always on. `rules/RULES.md` is one line per rule, wired into every harness so
it applies to every request in every repo. An agent never has to be told the same thing
twice. Each section names a longer rationale in `why/` for when the rule seems wrong.

**Skills** load when an agent recognises the situation from their description. Each owns a
piece of territory and names the sibling that owns the neighbouring piece, so two of them
never quietly disagree.

**Checks** run with no agent at all. `scripts/validate.mjs` needs nothing installed and
holds the stack to its own standards; a hook runs it after every edit to an artifact, so a
structural error surfaces in the same turn that caused it. `lint/<language>/` carries the
rules a linter can enforce in your repos.

A hook is also how the parallelism layer avoids depending on an agent choosing to look. A
skill only loads when the agent recognises the situation, so the session most likely to
collide with someone is the one that never loaded the skill. At session start a hook reads
the workspace board and puts what is in flight into context, whether or not the skill fires.

## Alongside skills and agents you already have

Nothing shadows your own. Plugin skills and agents are namespaced, so thiamine's are
`thiamine:interrogate` and `thiamine:code-simplifier`. A local skill or agent of the same
bare name keeps working and keeps its name.

**Split by what travels.** Your files own what is only true in your repos: services, paths,
build commands, deploy gates, architecture decisions. Thiamine owns what travels between
them: scope, abstraction, errors, tests, language idioms, review, prose. Write that split
down once in the repo's `CLAUDE.md` or `AGENTS.md`, along with which side wins. Without that
sentence somewhere, every session re-decides it.

**Cut, do not layer.** The mistake is keeping a workflow skill that already covers review
or pull requests and adding thiamine underneath. An agent then gets two answers for one task.
Delete the half thiamine owns and point at it.

**Keep local what thiamine cannot know.** A deploy gate, a proto ordering rule, or a
reviewer that knows your architecture decisions has no portable equivalent. Keep those, and
have them run the thiamine playbook for the general pass rather than restating it.

**Two copies of one agent drift.** The weaker one still answers. Where a local agent and a
thiamine agent do the same job, keep one, and if you keep yours, say in the instruction why.

## Skills

### Before you build

| Skill | Why |
| --- | --- |
| `pre-implementation` | Most bad implementations are correct answers to the wrong question. Sorts unknowns into what to observe and what to ask, then plans. |
| `consistency` | The second answer to a concern costs more than its merits. Finds what the codebase already does before adding another way. |
| `experimentation` | Improvement by measurement. One objective moved, the rest held as guards, hypotheses from the failures, and pruning. |

### While you build

| Skill | Why |
| --- | --- |
| `unslop-typescript` | Rejects code that throws away evidence the compiler would have checked. |
| `unslop-rust` | The same, for what the compiler and the type system can prove. |
| `unslop-python` | The same, on uv and ruff, where the annotation is the only contract. |
| `unslop-prose` | Cuts the tells that make writing read as machine-generated. |
| `technical-writing` | Decides what a document is before writing it, so docs do not become four documents fighting each other. |

### Carrying the change

| Skill | Why |
| --- | --- |
| `land-a-change` | Where a change lands, in one repo or several. Worktrees, pull requests, checks, and review comments, through to ready for approval. |
| `fan-out-work` | One agent, several subagents, one result. The cut, the brief, and making the pieces add up. |
| `working-alongside` | Another session is already in the repo. Whether to start, start and expect conflicts, or wait. |
| `handoff` | Context does not survive a session ending. Keeps the record that does. |

### Closing out

| Skill | Why |
| --- | --- |
| `post-implementation` | An agent can produce a change nobody understands. Makes sure the person who owns it can explain it and agrees with it. |
| `interrogate` | Somebody else's plan or pull request, from a human or an agent. What earns a finding, how to rank them, and when to stop picking nits. |

### Keeping the stack current

| Skill | Why |
| --- | --- |
| `thiamine-install` | Wires the stack into whichever harnesses are on the machine. |
| `thiamine-author` | Adds or revises a rule, skill, agent, or command without creating a second answer to something. |
| `reflect` | A long session figures things out and then loses them. Turns what it learned into skills, agents, and rules, so the next attempt is boring. |
| `capture-preferences` | The corrections you make about *how* are the ones you make forever. Captures them as a portable `<handle>-mode` skill agents follow. |
| `continual-learning` | The same loop for memory, which is the harness's rather than yours. Facts about you and the project, not about how work is done. |
| `maintain-skills` | Guidance goes stale silently. A periodic pass over what agents are told, against what the code now does. |

## Extending it

```sh
node scripts/new.mjs skill my-thing --standard
node scripts/validate.mjs --strict
```

Or hand it over: `use the thiamine-author skill to add a rule about swallowed exceptions`.

The validator is the part worth knowing about. It catches what prompting does not: a skill
naming a helper that does not exist, a description promising a trigger that cannot fire,
two skills that have quietly merged, an enforcement claim for a lint rule nobody wrote. It
also checks the README against the repo, so this page cannot quietly stop describing it.
Read [templates/README.md](templates/README.md) before adding anything, and
[lint/README.md](lint/README.md) to wire the lint layer into a repo.

## Where this came from

Seven skills and three rules derive from `pstack` in
[cursor/plugins](https://github.com/cursor/plugins), mostly its `poteto-mode` playbooks.

| What | Source | License |
| --- | --- | --- |
| Structure and most playbooks | [cursor/plugins](https://github.com/cursor/plugins) | none stated |
| TypeScript rules, vendored under `lint/typescript/` | [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) | MIT |
| Rust criteria and the clippy set | [Microsoft Pragmatic Rust Guidelines](https://microsoft.github.io/rust-guidelines/) | MIT |
| Writing standards | [Diátaxis](https://diataxis.fr), Google developer style, ASD-STE100, Global English | various |

## Status

Early, and in use. Twenty skills, twelve always-on rule sections, and a lint layer for
TypeScript, Rust, and Python. The rule corpus stays small on purpose, since every line is
paid on every request.
