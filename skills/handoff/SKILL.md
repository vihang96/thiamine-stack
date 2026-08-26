---
name: handoff
description: "Keeps a durable record of work in progress so a new session can continue it, and reconstructs that record from transcripts and live state when none was kept. Use when starting work that will span sessions, when recording a decision or a deviation mid-build, when context is about to compact, and for catch me up or where did I leave off."
owns: "the record of work in progress, and reconstructing it when none was kept"
see_also: [multi-repo-mechanics, continual-learning]
---

# Handoff

Context does not survive. A session ends, a context compacts, a day passes, someone else
picks it up. What survives is what was written down.

Two paths, and the difference in cost is the whole point of this skill. If a record was
kept, resuming is reading one file. If it was not, resuming means mining transcripts,
checking branches, and guessing at intent, which takes an hour and still misses the
reasoning. Keep the record.

## Scope

This skill owns the record of work in progress and how to rebuild it when it is missing.

`multi-repo-mechanics` owns the git side of stopping and resuming, which is committing work
in each worktree and checking what moved underneath you. Its `pause-safely` and
`session-pickup` playbooks do that and use the record defined here.

`continual-learning` owns durable memory, which is facts about the user and the project.
The difference is lifetime. A memory outlives the task. A handoff record dies when the work
lands, and keeping it afterwards is how a stale plan gets followed months later.

## The record

One file per change, at `<workspace>/.handoff-<branch>.md`. Beside the work, not in a temp
directory that gets swept, and gitignored, since it is working state rather than a
deliverable.

Two parts. A header holding current state, rewritten as it changes. A log below it,
appended and never edited.

```markdown
# Add retention policies to workspaces

Goal: let an admin set how long exception data is kept, per workspace.
Status: proto merged, service half done.
Next: wire the scheduler to read the policy. Start at RetentionJob.run.
Where: orders/tree/feat-retention, orders-schema (merged #47)
Assumed: existing rows count as unlimited until an admin sets a policy.

## Log

- Chose a nullable column over a separate table. One policy per workspace, and a
  join for every read was not worth the shape.
- Deviated from the plan: the scheduler cannot read the policy directly, it runs
  before tenant context exists. Passing it in at enqueue time instead.
- Tried a cascade delete. Reverted, it removed audit rows the compliance job needs.
```

The header answers where things stand. The log answers why they stand there, which is the
part nobody can reconstruct and the part that stops the next session re-deciding what this
one already settled.

## Playbooks

| Situation | Playbook |
| --- | --- |
| Mid-build, something was decided or the plan changed | `playbooks/build-log.md` |
| Resuming with no record, or one that stopped being true | `playbooks/recall.md` |

Stopping cleanly and picking back up are `multi-repo-mechanics`, which handles the commits
and the drift.

## Do not

- Write the record at the end. A log written from memory at the end is a summary, and the
  decisions it forgot are the ones that mattered.
- Keep it after the work lands. Delete it with the branch. A record that outlives its change
  is read as current by the next person who finds it.
- Put it in the commit. It is scaffolding for the work, and `rules/RULES.md` says to delete
  scaffolding when the work lands rather than shipping it.
- Reconstruct when a record exists. Read it first, then verify it against the repository,
  and trust the repository where they disagree.

## Source

The reconstruction half is adapted from `recall` in `github.com/cursor/plugins`, fetched
2026-08-26, which carries no license. Two ideas in the build log come from `show-me-your-work`
in the same repo: evidence is a pointer rather than prose, and an entry records its outcome.
