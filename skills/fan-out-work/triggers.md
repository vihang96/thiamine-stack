# Trigger examples: fan-out-work

Prompts that must load this skill, and near-misses that must not.

## Should fire

- spawn a few agents to do these three independent pieces at the same time
- can we parallelise this across the four repos in one go
- run these migrations in parallel, one agent per package
- these two subagents both finished, do their changes conflict with each other
- work out whether this splits into parallel units or has to be sequential
- fan out an investigation across the workspace and give me one answer
- I want five lanes on this, what does each one get told
- check the parallel work adds up before we open any pull requests

## Should not fire

- someone else is already working in this repo, is it safe for me to start. That is
  `working-alongside`, which owns work the session did not spawn.
- create the worktrees for this change. The worktree lifecycle is
  `land-a-change`.
- plan this change into steps. Sequencing is `pre-implementation`, and it routes here only
  if the steps turn out to be independent.
- review this diff for bugs. The language standards own code review, whoever wrote it.
- there are two different date libraries in here, which should we use. That is
  `consistency`, whether or not agents caused it.
- open a pull request for each of these branches. The harness owns pull requests.
