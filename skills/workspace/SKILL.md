---
name: workspace
description: "Works across a multi-repo workspace using one git worktree per repo per change. Use when starting work that touches more than one service, when creating or cleaning up worktrees, when pausing work to resume later, or when picking up a session someone else left."
owns: "the multi-repo workspace layout, worktree lifecycle, and handing work between sessions"
see_also: [thiamine-author]
---

# Workspace

A workspace is a directory of sibling repositories, one per service. A change usually
touches more than one of them, so the unit of work is a set of worktrees on the same
branch name rather than a single checkout.

```
<workspace>/
  astral/                              the main checkout, always on the default branch
    tree/
      feat-guide-success-rate          a worktree, one per change
      fix-retry-backoff
  astral-proto/
    tree/
      feat-guide-success-rate          same branch name, paired change
  agora/
```

## Conventions

**One branch name across every repo a change touches.** A feature spanning a service and
its proto repo uses the same branch in both. That is what makes the set findable later,
and it is what `scripts/audit.sh` groups by.

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

## Audit before deciding

```sh
sh scripts/audit.sh <workspace-root>
```

Read-only. One line per worktree with the facts a decision needs, flagged `dirty`,
`unpushed:N`, `gone`, `no-upstream`, `detached`, or `missing-dir`.

Run it before any cleanup and before answering "what was I working on". It is faster than
walking the repos, and it is the only way to see a worktree holding uncommitted work
before you remove it.

## Do not

- Remove a worktree the audit flags `dirty` or `unpushed` without showing the user what is
  in it. Those flags mean work exists in exactly one place.
- Work in the main checkout. A branch there blocks every worktree that wants it and leaves
  the one predictable directory in an unpredictable state.
- Create a worktree for a branch that already has one elsewhere in the repo. Git refuses,
  and the error names the existing path. Use it.
- Assume every repo in the workspace is involved. A change touches the repos it touches,
  and a worktree in a repo you never edit is noise in every future audit.
