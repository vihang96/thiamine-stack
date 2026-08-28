# Trigger examples: pre-implementation

Prompts that must load this skill, and near-misses that must not.

## Should fire

- add a retention policy to workspaces
- this endpoint is slow, make it faster
- how does the guide approval flow work
- we need to migrate off the old exception schema
- plan this out, it touches three repos
- users are reporting duplicate notifications, figure out why
- what do you need to know before starting this
- mock up a few directions for this settings page
- should this be a state machine or a status field
- what breaks if I change this field to optional
- is this safe to change, it is called from everywhere
- this page takes four seconds to load, fix it
- reduce the memory this worker uses

## Should not fire

- fix the typo in this error message. A change with nothing to find out.
- rename this function. Ordinary work, already understood.
- get this PR green. That is land-a-change, and the deciding is done.
- review this diff for bugs. The language standards own code review.
- clean up the worktrees. Workspace mechanics, not deciding what to build.

## Fires alongside land-a-change

A change that spans repos needs a plan and then worktrees. This skill decides what is being
built and in what order. `land-a-change` sets up the worktrees and carries the pull
requests. The handoff is the plan.
