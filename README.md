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
line-by-line review. That is what makes a software factory possible: parallelism you can
actually rely on.

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
holds the stack to its own standards. `lint/<language>/` carries the rules a linter can
enforce in your repos.

## Skills

### Before you build

| Skill | Why |
| --- | --- |
| `pre-implementation` | Most bad implementations are correct answers to the wrong question. Sorts unknowns into what to observe and what to ask, then plans. |
| `consistency` | The second answer to a concern costs more than its merits. Finds what the codebase already does before adding another way. |

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
| `multi-repo-mechanics` | A change spans repos. Worktrees, pull requests, checks, and review comments, through to ready for approval. |
| `handoff` | Context does not survive a session ending. Keeps the record that does. |

### Closing out

| Skill | Why |
| --- | --- |
| `post-implementation` | An agent can produce a change nobody understands. Makes sure the person who owns it can explain it and agrees with it. |

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

Six skills and three rules derive from `pstack` in
[cursor/plugins](https://github.com/cursor/plugins), mostly its `poteto-mode` playbooks.

| What | Source | License |
| --- | --- | --- |
| Structure and most playbooks | [cursor/plugins](https://github.com/cursor/plugins) | none stated |
| TypeScript rules, vendored under `lint/typescript/` | [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) | MIT |
| Rust criteria and the clippy set | [Microsoft Pragmatic Rust Guidelines](https://microsoft.github.io/rust-guidelines/) | MIT |
| Writing standards | [Diátaxis](https://diataxis.fr), Google developer style, ASD-STE100, Global English | various |

## Status

Early, and in use. Sixteen skills, eleven always-on rule sections, and a lint layer for
TypeScript, Rust, and Python. The rule corpus stays small on purpose, since every line is
paid on every request.
