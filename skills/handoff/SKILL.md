---
name: handoff
description: "Keeps a durable record of work in progress so a new session can continue it, and reconstructs it from transcripts and live state when none was kept. Use before clearing or compacting context, when work will span sessions or days, when recording a decision mid-build, and for catch me up or where did I leave off."
owns: "the record of work in progress, and reconstructing it when none was kept"
see_also: [land-a-change, continual-learning, reflect, working-alongside, experimentation]
---

# Handoff

Context does not survive. A session ends, a context compacts, a day passes, someone else
picks it up. What survives is what was written down.

Two paths, and the difference in cost is the whole point of this skill. If a record was
kept, resuming is reading one file. If it was not, resuming means mining transcripts,
checking branches, and guessing at intent, which takes an hour and still misses the
reasoning. Keep the record.

## When the record is not worth keeping

The record pays for itself when the work outlives the context holding it. Below that it is
a file to maintain and a second copy that can disagree with the repository, and a skill
that demands one for a twenty-minute task is a skill people stop running.

Skip it when all three hold:

- The work finishes in this session, and you can see where it ends.
- You have decided nothing the code will not show. A choice visible in the diff is already
  recorded, and the log is for the reasoning that leaves no trace.
- Nobody else is going to pick this up.

Start one the moment any of those stops being true: a compaction warning, a second session
arriving, an interruption, or the first decision you would have to explain later.
Starting late costs a paragraph reconstructed from a context you still have. Starting never
costs the hour in `playbooks/recall.md`.

The cost is asymmetric, so lean toward keeping it. Keeping one you did not need costs a
file. Skipping one you needed loses the reasoning, and the repository cannot give it back.

## Scope

This skill owns the record of work in progress and how to rebuild it when it is missing.

`land-a-change` owns the git side of stopping and resuming, which is committing work
in each worktree and checking what moved underneath you. Its `pause-safely` and
`session-pickup` playbooks do that and use the record defined here.

`continual-learning` owns durable memory, which is facts about the user and the project.
The difference is lifetime. A memory outlives the task. A handoff record dies when the work
lands, and keeping it afterwards is how a stale plan gets followed months later.

`working-alongside` owns the announcement a session leaves for other sessions running at
the same time. The difference is the audience. This record is for whoever continues this
work, and holds the reasoning. That announcement is for whoever might collide with it, and
holds only what a stranger needs to judge overlap. One file serving both is stale for both.

`experimentation` keeps its own log, one row per attempt, and that is the record of a
search rather than of a session. A decision that came out of a run belongs in both: the
attempt row says what the number did, and the log here says what you concluded and chose.

`reflect` runs at that death. Before the record is discarded, its decisions, deviations, and
failed attempts are the best available input for deciding what should become a skill.

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

Stopping cleanly and picking back up are `land-a-change`, which handles the commits
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
