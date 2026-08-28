# Trigger examples: branch-to-pr

Prompts that must load this skill, and near-misses that must not.

## Should fire

- I want to add a skill to this repo, where should the work go
- start on the retry bug, this repo only
- set up worktrees for a change that spans a service and its schema repo
- clean up the worktrees, there are too many
- what was I working on before the weekend
- I need to stop here, leave things so I can pick them up tomorrow
- add another repo to the branch I am already working on
- which worktrees have uncommitted work
- get this PR green, the checks are failing
- address the review comments on my PR
- is this ready for approval
- split this into a stack, it is too big to review at once
- what is blocking the stack

## Should not fire

- commit and push this. Committing is the harness's own command.
- create a worktree for each open PR so I can review them. That is reading other people's
  work, not carrying a change of your own.
- merge this PR. A human merges, after approving.
- review this diff for correctness bugs. That is `interrogate`, with the language standards
  for the code-level criteria.
- why is the build failing in this worktree. A build failure, whatever directory it is in.
- rename this function. Ordinary work inside a worktree that already exists. The boundary is
  whether the change has somewhere to land yet: deciding that fires this skill, and editing
  once it is decided does not.
- spawn five agents to work on these repos at once. Splitting work into parallel lanes is
  `fan-out-work`; this skill is what each lane runs.
- another session is already in this repo, can I start. That judgement is
  `working-alongside`.
