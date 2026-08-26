# Trigger examples: handoff

Prompts that must load this skill, and near-misses that must not.

## Should fire

- catch me up on the retention work
- what was I working on last week
- I am going to clear the context, write down where we are
- we decided to pass the policy in at enqueue time instead, note that
- this is going to take a few days, keep track as we go
- where did I leave off

## Should not fire

- what did I ask you to do earlier in this session. Already in context.
- summarize this conversation. A summary is not a record of work in progress.
- pick up the branch in orders/tree/feat-retention. One known session with a worktree, so
  that is multi-repo-mechanics.
- remember that I prefer tabs. A durable fact about the user, so continual-learning.
- what does this function do. That is investigation, in pre-implementation.

## Fires alongside multi-repo-mechanics

Stopping and resuming touch both. This skill owns what the record says. That one owns the
commits in each worktree and checking whether the base moved while you were gone.
