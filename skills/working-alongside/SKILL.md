---
name: working-alongside
description: "Decides whether work about to start will interfere with work another session or another person already has in flight, then starts it, starts it expecting merge conflicts, or arms it to begin when the other work lands. Use when opening a second session on a repo, when starting work someone else may already be in, and when a change has to wait for another one to land first."
owns: "starting work while other sessions already have work in flight: the announcement, the overlap judgement, and waiting on a predicate"
see_also: [fan-out-work, land-a-change, handoff, consistency, pre-implementation]
---

# Working alongside

A second session opens on a repo where work is already in flight. Nobody has the whole
picture, and no amount of context inside the new session will produce one, because the other
session's work is not in the repository yet.

Two people on a team solve this without a scheduler. They say what they are working on,
judge the overlap, accept the occasional conflict, and ask when it is genuinely unclear.
That is the model to copy. Locks are not.

## Scope

This skill owns starting work alongside work this session did not spawn: another session,
another machine, another person.

`fan-out-work` owns the opposite case, where one agent spawned the parallel work itself and
therefore knows the cut. If you decided the split, that skill applies and this one does not.

`land-a-change` owns worktrees, branches, and the pull request. It already refuses a
second worktree on one branch, which is the one place a hard stop is correct, and its
`audit.sh` reports what exists on disk. This skill adds who is on it and whether starting is
safe.

`handoff` owns the record of work in progress, which is for the next session to resume the
same work. An announcement here is for a different session to avoid colliding with it. One
is memory, the other is a signal, and merging them produces a file that is stale for both
purposes.

## What is in flight

Three places, cheapest first, and each covers what the one before it cannot.

**Git already refuses a second worktree on the same branch**, and the error names the path
holding it. Free, enforced, no bookkeeping.

**The board**, at `<workspace>/.thiamine/lanes/<slug>`, one file per unit of work. It says
what a session is doing so another session can judge overlap. The workspace is the directory
of sibling repos rather than any one repo, and a writer that picks a different root from the
readers has made a second board that nobody scans. One writer per file and
nobody reads a file they did not write, so there is no contention and nothing to lock.
An entry is an announcement, never a claim: it never blocks anyone, and a stale entry from a
dead session is out of date rather than dangerous.

**A pushed branch**, which is the only signal that reaches another machine or another
person. `gh pr list` and `git ls-remote` are the cross-machine board, and pushing early is
how you appear on it.

```sh
sh scripts/lanes.sh <workspace-root>      # what is in flight, and how stale each entry is
sh scripts/ready.sh <workspace-root>      # which waiting units are now unblocked
```

A SessionStart hook runs the first of those for you and puts the result in context, so a
session that never loads this skill still sees the board. It reports and stops there. It
does not announce on your behalf, because at session start there is no unit yet, and it
cannot help the first session in a workspace, because an empty board has nothing to say.
Announcing is still step 2 below.

## What the board does not cover

It records intent. It does not make a working tree safe to share.

Every route below assumes each unit has its own checkout, so two sessions in one working
tree are outside all of them: nothing here separates the writers, and git's refusal of a
duplicate worktree cannot fire when nobody created a worktree. `git add -A` from either
session sweeps up the other's edits, and the announcement that both sessions dutifully
wrote does not change that.

Where you find yourself in a shared tree, either move to a worktree per unit, per
`land-a-change`, or hold to path-scoped commits on both sides and never stage by
wildcard. Say which of the two you are relying on, because a careful session that announced
and then read this skill will otherwise believe it is covered.

## The three routes

Judge the overlap, then take one of these. `playbooks/judge-the-overlap.md` is how you
decide, and the test it turns on is whether your work needs the other work's **files** or
its **answers**.

| What overlaps | Route |
| --- | --- |
| Nothing | start, and the ordinary workflows apply |
| The same files, for unrelated reasons | start, and expect to resolve conflicts at merge |
| The same design question | do not start yet: settle the answer, or wait for it to land |
| Your work consumes theirs | wait, armed on a predicate |

Git merges text. It cannot merge decisions. If both units are choosing how an error is
shaped or what a field is called, no merge tool will save you, and that is the only case
where waiting beats starting.

## Procedure

1. **Look before starting.** Run `scripts/lanes.sh`, and `land-a-change`'s
   `audit.sh` for what is on disk. Fetch, so pushed branches from other machines are
   visible.

2. **Announce your own unit**, per `playbooks/declare-and-discover.md`. Do this before
   working, not after, since an announcement written at the end helped nobody.

3. **Judge the overlap**, per `playbooks/judge-the-overlap.md`, and pick a route. Where it
   is genuinely unclear, present the two blast radii and ask, and get on with anything that
   does not depend on the answer meanwhile.

4. **Arm the wait if you are waiting**, per `playbooks/wait-for-a-predicate.md`. A wait with
   no mechanism is a plan to remember something.

5. **Re-check when it fires.** The world moved while you waited, so run step 1 again before
   starting. A predicate passing means the blocker cleared, not that starting is now safe.

6. **Retire your entry when the work lands.** Delete it with the branch. An announcement
   that outlives its work makes every future overlap check wrong.

## Playbooks

| Situation | Playbook |
| --- | --- |
| About to start, and something else may be in flight | `playbooks/declare-and-discover.md` |
| Something else is in flight and you need to decide | `playbooks/judge-the-overlap.md` |
| The work has to wait for another change to land | `playbooks/wait-for-a-predicate.md` |

## Verify

You have done this correctly when `scripts/lanes.sh` shows your unit, the route you took is
stated with the overlap that justified it, and anything armed appears in `scripts/ready.sh`
as waiting on a predicate you can run by hand.

## Do not

- Ask the user whether it is safe to start before gathering the facts. The overlap is
  something to look up. Only the cost of a conflict against the cost of waiting is theirs.
- Block on the answer. Write the question down with a default, do everything that does not
  depend on it, and batch the ask into your next report.
- Treat a board entry as permission or as a lock. It is a note about intent.
- Delete another session's entry because it looks stale. Report it. The session may be
  alive and slow, and the cost of being wrong is asymmetric.
- Work in someone else's worktree, or push to their branch, because the overlap looked
  small. Two writers on one branch is the one thing that reliably destroys work.
- Wait on a duration. "Check back in an hour" is not a predicate and cannot pass or fail.
