---
name: working-style
description: "Captures how a person likes to work as a portable <handle>-mode skill that agents load and follow, covering tone, verification posture, delegation habits, and the corrections they keep making. Use for automate me, capture or update my working style, make a mode skill for me, or when the same correction about how rather than what has come up again."
owns: "the record of one person's taste and habits, as instructions an agent follows"
see_also: [reflect, continual-learning, thiamine-author]
---

# Working style

The corrections a person makes about *how* are the ones they make forever. Paste the output
rather than summarising it. Give a recommendation, not a survey. Do not fold a refactor into
a feature. Each is cheap to say once and exhausting to say weekly, and no agent starts a
session knowing any of them.

This captures those as a `<handle>-mode` skill: `vihang-mode`, `priya-mode`. One file, in
the user's name, that an agent loads and follows.

## Scope

Three things learn from watching a person work, and they are not the same thing:

| | Memory | `<handle>-mode` | Method skills |
| --- | --- | --- | --- |
| Owned by | `continual-learning` | this skill | `reflect` |
| Holds | facts | taste and habits | proven ways of working |
| About | the user and the project | the user | the work |
| Form | statements that inform | instructions that direct | procedures and criteria |
| Portable | no, one harness on one machine | yes, it ships | yes |

"Uses uv rather than pip" is a fact, and memory holds it. "Wants the command and its output
pasted, never a summary of it" is taste, and it belongs here. "Drive CI green before asking
for review" is a method, true regardless of who is asking, and `reflect` owns it.

The test for this file: **would it stop being true if a different person sat down?** If yes
it is taste. If no it is a method skill, and putting it here hides it from everyone else.

### Why this one does not wait

`reflect` holds shipped artifacts to a bar of recurrence, because a method skill claims
something works and that claim needs evidence. A taste claim does not work that way. The
user is the authority on their own preferences, so a preference is true the moment they
state it, and waiting for a second occurrence just means being corrected twice.

So this is captured continuously, as the work happens. What still needs care is telling a
standing preference from a reaction to one situation, which is step 3.

## Procedure

### 1. Pick the size of the pass

Two paths, and using the heavy one for a one-line preference is why these files stop
getting updated.

- **One preference, observed now.** Append it and stop. No mining, no interview. This is the
  common case and it should cost one edit.
- **A full pass.** Building the file, or revising it after months. Continue below.

### 2. Find the existing file

```sh
ls skills/*-mode/SKILL.md ~/.claude/skills/*-mode/SKILL.md 2>/dev/null
```

If one exists, update it rather than starting over, and mine only what happened since:

```sh
git log -1 --format=%cI -- <path>
```

Starting fresh discards preferences the user stated once and never repeated, which are
exactly the ones they will be annoyed to repeat.

### 3. Gather evidence, then ask

Mine first, because people describe how they want to work differently from how they
actually correct. Delegate the reading, reusing `skills/reflect/references/miner.md` with the **Correction**
lens, which already returns the right shape.

What counts:

| Signal | Example |
| --- | --- |
| Response shape | length, tone, tables over prose, no preamble |
| Verification posture | what "done" means, run it versus reason about it |
| Delegation habits | subagents, parallelism, what they want done inline |
| Process conventions | worktrees, commit style, when to open a PR |
| Scope discipline | how they react to work they did not ask for |
| Meta | fixing the standard mid-task rather than after |

Then **ask them directly**, with concrete options rather than an open question. Mining only
sees preferences that have already been violated. The ones never yet crossed are invisible
to it and are often the strongest.

### 4. Separate taste from reaction

A preference stated under frustration about one situation is not a standing rule. Before
recording, check:

- Have they said it about a second, unrelated case? Or stated it as a general rule?
- Does it contradict something already in the file? Then it is a revision, and the old line
  comes out. A mode skill accumulating contradictions is followed at random.
- Is it actually about this project? That belongs in the repo's `AGENTS.md`.

When unsure, ask. This file describes a person, and they can settle it in one word.

### 5. Write it as instructions

Address the agent, about the user. "Paste the command and its output" reads as a rule.
"Vihang likes seeing output" reads as trivia, and an agent will not act on it.

- **One line per preference.** No rationale unless the rule is confusing without it.
- **Say the behaviour, not the trait.** "Give a recommendation and proceed" beats "is
  decisive".
- **Keep it short enough to be read.** A mode skill past a page stops being followed, and
  the preferences at the bottom might as well not exist. When it grows, cut the ones the
  agent would do anyway.

Hand the file itself to `thiamine-author`, which owns shape and validation.

### 6. Show it to them

The user is the authority here, so they review it, and their word overrides anything mined.
Show the diff, not the whole file, for an update.

## Verify

- `node scripts/validate.mjs` is clean.
- Every line is a behaviour an agent can act on, not a description of a person.
- No project names, module paths, or facts that belong in memory.
- The user has read it.

## Do not

- Record what they asked for as how they like things. A request is content; a correction
  about the shape of the answer is taste.
- Restate the always-on rules. `rules/RULES.md` already loads; repeating it here costs
  budget and creates a second copy that will drift.
- Let it grow without cutting. Every pass should remove something.
- Write facts here. Those are memory, and `continual-learning` owns them.
