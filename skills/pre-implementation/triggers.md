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

## Should not fire

- fix the typo in this error message. A change with nothing to find out.
- rename this function. Ordinary work, already understood.
- get this PR green. That is workspace-coding, and the deciding is done.
- review this diff for bugs. The language standards own code review.
- clean up the worktrees. Workspace mechanics, not deciding what to build.

## Fires alongside workspace-coding

A change that spans repos needs a plan and then worktrees. This skill decides what is being
built and in what order. `workspace-coding` sets up the worktrees and carries the pull
requests. The handoff is the plan.
