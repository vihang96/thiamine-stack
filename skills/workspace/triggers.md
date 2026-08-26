# Trigger examples: workspace

Prompts that must load this skill, and near-misses that must not.

## Should fire

- set up worktrees for a change that touches astral and its proto
- clean up the worktrees, there are too many
- what was I working on before the weekend
- I need to stop here, leave things so I can pick them up tomorrow
- add the agora repo to the branch I am already working on
- which worktrees have uncommitted work

## Should not fire

- commit and push this. Committing is the harness's own command.
- open a pull request for this branch. Not worktree lifecycle.
- create a worktree for each open PR so I can review them. That is review, not a change
  spanning repos.
- why is the build failing in this worktree. A build failure, whatever directory it is in.
- rename this function. Ordinary work that happens to be inside a worktree.
