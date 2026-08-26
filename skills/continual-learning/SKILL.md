---
name: continual-learning
description: Runs the continual-learning loop by delegating transcript mining to the memory-updater agent, keeping the mined transcripts out of the main context. Use when asked to mine prior chats, refresh project memory, or remember what was learned in earlier sessions.
disable-model-invocation: true
owns: "durable facts about the user and the project, in the harness memory store"
requires: [memory-updater]
see_also: [reflect, capture-preferences, handoff]
---

# Continual learning

Keep project memory current by delegating the whole flow to one subagent.

This skill is orchestration only. Mining transcripts reads a large amount of text, and the
point of the subagent is that the text stays in its context rather than yours. If you read
transcripts here, the skill has failed at its only job.

The skill is user-invoked on purpose. Transcript mining is expensive and should never fire
on its own, which is why `disable-model-invocation` is set.

## Scope

This skill and the `memory-updater` agent own durable facts about the user and the
project. Those go in the harness memory store.

They do not own work in progress. A note about where a half-built feature stands is a
handoff record, owned by the `handoff` skill, and it is deleted when the work lands. A
memory outlives the task.

They do not own engineering standards. Memory is intrinsic to the harness: one machine, no
review, correctable in a line. A skill, an agent definition, or a rule is shipped, read by
every agent in every repo, and held to a higher bar for that reason. A lesson about how work
should be done is one of those three, and `reflect` owns deciding which and promoting it. A
preference about how this user wants work done is a `<handle>-mode` skill, owned by
`capture-preferences`.

When the updater reports a candidate of that kind, say so and stop. Do not write it to
memory, and do not write it to `rules/`, `skills/`, or `agents/` yourself.

## Procedure

1. Invoke the `memory-updater` agent.
2. Return its report unchanged.

## Verify

Check that the updater wrote only inside the memory store. If it touched `AGENTS.md`,
`CLAUDE.md`, `rules/`, or `skills/`, revert that change and report it. In a thiamine
install those instruction files are symlinks to `rules/RULES.md`, so a write there edits
the engineering standard for every harness at once.

## Do not

- Mine transcripts or edit files in this flow. Delegate both.
- Skip the subagent, even for a single transcript.
- Report success without reading the updater's report.
