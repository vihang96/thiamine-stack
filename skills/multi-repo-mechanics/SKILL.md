---
name: multi-repo-mechanics
description: "Carries one change across a multi-repo workspace, from worktrees through to a pull request ready for approval. Use when work touches more than one service, when creating or cleaning up worktrees, when pausing or resuming a session, when opening or stacking pull requests, when driving checks green, or when triaging review comments."
owns: "the multi-repo workspace layout, the worktree lifecycle, and the git side of stopping and resuming"
see_also: [handoff]
---

# Multi-repo mechanics

A workspace is a directory of sibling repositories, one per service. A change usually
touches more than one of them, so the unit of work is a set of worktrees on the same
branch name rather than a single checkout.

```
<workspace>/
  orders/                          the main checkout, always on the default branch
    tree/
      feat-partial-refunds         a worktree, one per change
      fix-retry-backoff
  orders-schema/                   the contract the service publishes
    tree/
      feat-partial-refunds         same branch name, paired change
  inventory/
```

## Conventions

**One branch name across every repo a change touches.** A feature spanning a service and
the repo holding its published contract uses the same branch in both. That is what makes
the set findable later, and it is what `scripts/audit.sh` groups by.

**Worktrees live at `<repo>/tree/<branch-with-dashes>`.** Slashes in the branch become
dashes, so `feat/guide-success-rate` becomes `tree/feat-guide-success-rate`. One directory
level means `ls tree/` shows every change in that repo and cleanup never walks a hierarchy.

**The main checkout stays on the default branch.** It is where you fetch, where you branch
from, and the one directory whose state is never a surprise. Work happens in worktrees.

## Scope

This skill owns the workspace layout, the worktree lifecycle, and handing work between
sessions.

It does not own committing, pushing, or opening a pull request. Whatever the harness
provides for those still applies.

It does not own what a handoff record says either. The `handoff` skill defines that, and
`pause-safely` and `session-pickup` use it. What stays here is the git side: the commit in
each worktree, and checking whether the base moved while you were gone.

Some harnesses also ship a command that makes one worktree per open pull request in a
single repo. That answers a different question, which is what is currently under review.
This skill answers what am I changing, and the answer spans repos.

## Playbooks

Read the one that matches. Each is a procedure with its own reply contract.

| Situation | Playbook |
| --- | --- |
| Starting a change, or adding a repo to one in progress | `playbooks/worktree-setup.md` |
| Worktrees have piled up, or a change has landed | `playbooks/worktree-cleanup.md` |
| Stopping for the day, or context is about to compact | `playbooks/pause-safely.md` |
| Resuming work, yours or someone else's | `playbooks/session-pickup.md` |
| The change is ready for review | `playbooks/opening-a-pr.md` |
| Splitting a change too large to review at once | `playbooks/stacked-prs.md` |
| Checks are red, or you are waiting on them | `playbooks/drive-ci-green.md` |
| A reviewer or a bot left comments | `playbooks/triage-review-comments.md` |
| Deciding whether it is ready for approval | `playbooks/shippable.md` |

The review loop runs several times. Open, drive to green, triage the comments, fix, back
to green. Treat the second round as normal rather than as something going wrong.

## Where the agent stops

The agent opens pull requests, drives the checks green, and answers review comments. A
human approves and a human merges. Never merge, never enable auto-merge, and never approve
your own work, whatever the checks say.

## Audit before deciding

```sh
sh scripts/audit.sh <workspace-root>
```

Read-only. One line per worktree with the facts a decision needs, flagged `dirty`,
`unpushed:N`, `gone`, `no-upstream`, `detached`, or `missing-dir`.

Run it before any cleanup and before answering "what was I working on". It is faster than
walking the repos, and it is the only way to see a worktree holding uncommitted work
before you remove it.

For pull request state rather than worktree state:

```sh
sh scripts/pr-status.sh <branch> <workspace-root>           # one branch, every repo
sh scripts/pr-status.sh --stack <branch> <workspace-root>   # the stack, bottom first
```

It names every failing check. A change spanning repos is as ready as its worst repo, and a
stack is as ready as its lowest unfinished pull request.

## Do not

- Remove a worktree the audit flags `dirty` or `unpushed` without showing the user what is
  in it. Those flags mean work exists in exactly one place.
- Work in the main checkout. A branch there blocks every worktree that wants it and leaves
  the one predictable directory in an unpredictable state.
- Create a worktree for a branch that already has one elsewhere in the repo. Git refuses,
  and the error names the existing path. Use it.
- Assume every repo in the workspace is involved. A change touches the repos it touches,
  and a worktree in a repo you never edit is noise in every future audit.
