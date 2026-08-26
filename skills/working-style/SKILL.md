---
name: working-style
description: "Captures how a person likes to work as a portable <handle>-mode skill that agents load and follow, covering response style, autonomy, verification posture, delegation, and the corrections they keep making. Use for automate me, capture or update my working style, make a mode skill for me, or when the same correction about how rather than what has come up again."
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

## When not to use

A mode skill is a heavy, opinionated file describing a whole way of working. Three nearby
requests are not that:

- **One narrow workflow**, such as how the user writes commit messages. That is an ordinary
  skill. Hand it to `thiamine-author` directly, with no mining.
- **A task-specific skill** that happens to have been requested by a person. The subject is
  the task, not them.
- **A convention of the repo** rather than of the person. That goes in the repo's own
  `AGENTS.md`, where it is true for everyone who works there.

The tell is the subject. If the file would make sense with the person's name removed from
it, it does not belong here.

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
actually correct. Delegate the reading, reusing `skills/reflect/references/miner.md` with
the **Correction** lens, which already returns the right shape.

Then **ask them directly**, with concrete options rather than an open question. Mining only
sees preferences that have already been violated. The ones never yet crossed are invisible
to it and are often the strongest. Two rounds of structured questions and one open one is
enough; twenty questions gets abandoned halfway.

### 4. Keep only what is really a preference

Mining returns two kinds of thing, and they do not have the same bar:

- **Declared.** The user stated a standing rule: "always paste the output", "never open a PR
  without CI green". True when they say it. They are the authority on themselves, and asking
  for a second instance is absurd.
- **Inferred.** You watched one correction and generalised. This is most of what mining
  returns, and generalising from a single case is exactly overfitting. It needs a second,
  unrelated instance before it goes in.

**A contradiction kills a line outright, at any count.** If they wanted terse output on
Tuesday and full detail on Thursday, the preference is not "terse", it is conditional on
something you have not identified. Encoding the unconditional version makes the agent wrong
half the time, which is worse than not knowing.

Two more filters. A line that contradicts something already in the file is a revision, so
the old line comes out; a file accumulating contradictions is followed at random. And a line
about this project belongs in that repo's `AGENTS.md`.

When unsure, ask. This file describes a person, and they can settle it in one word.

### 5. Cluster into sections, and only the ones that earn a place

Group what survived. This is a menu, not a template:

| Section | Covers |
| --- | --- |
| Response style | length, tone, format, what to lead with |
| Autonomy | how much to do without asking; when to stop and confirm; tool and MCP use |
| Understand first | which skills to reach for when scoping or investigating |
| Subagents | default posture, parallelism, model to task, specialised workflows |
| Prose and code discipline | principles they cite, lint and format tools, style guides |
| Review and verify | repro posture, what "done" means, live-testing tools |
| Process | worktrees, commits, PRs, review and merge tooling |
| Skills | authoring habits, fixing the standard mid-task, proposing new ones |

**A section earns its place by holding a specific, non-default rule.** "Communicate clearly"
is not a section. "Short paragraphs. Tables when comparing options. Bullets only when the
items are genuinely parallel" is.

**Do not force symmetry.** A user with no process rules worth writing down gets no Process
section. Sparse is correct; a file with eight thin sections is a file nobody finishes.

### 6. Write the file

Address the agent, about the user. "Paste the command and its output" reads as a rule.
"Vihang likes seeing output" reads as trivia, and an agent will not act on it.

- **Use "the user", not their first name**, in the instructions themselves. Others read and
  adopt these files, and a name in every imperative makes it unusable by anyone else. The
  name belongs in the filename and the description.
- **One line per preference.** No rationale unless the rule is confusing without one.
- **Say the behaviour, not the trait.** "Give a recommendation and proceed" beats "is
  decisive".
- **Reference, do not inline.** A skill or a principle doc the user relies on appears as a
  path. Pasting an excerpt creates a second copy that drifts from the original.
- **Keep it operational.** No metaphors, no framing, no prose written to be enjoyed. This
  file is read by an agent under a context budget.

The frontmatter of the file you produce:

- `description` triggers on the handle and `/<handle>-mode` and "work in their style". Not
  on generic terms like "write code", which would fire it constantly.
- `disable-model-invocation: true` unless the user asks otherwise. A mode skill is heavy and
  opinionated, and should apply when invoked rather than whenever a description matches.

Hand the file to `thiamine-author`, which owns shape and validation.

### 7. Show it to them

The user is the authority here, so they review it, and their word overrides anything mined.
Show the diff, not the whole file, for an update. Expect several rounds.

## Verify

There is no benchmark for this. It is subjective output, so the check is the user: does it
read like them, and what is missing. Alongside that:

- `node scripts/validate.mjs` is clean.
- Every line is a behaviour an agent can act on, not a description of a person.
- No first names in imperatives, no project names, no facts that belong in memory.
- Every inferred line names its second instance.

## Do not

- Record what they asked for as how they like things. A request is content; a correction
  about the shape of the answer is taste.
- Restate the always-on rules. `rules/RULES.md` already loads; repeating it here costs
  budget and creates a second copy that will drift.
- Let it grow without cutting. Every pass should remove something.
- Write facts here. Those are memory, and `continual-learning` owns them.
