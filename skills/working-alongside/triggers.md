# Trigger examples: working-alongside

Prompts that must load this skill, and near-misses that must not.

## Should fire

- I have another session running on this repo, is it safe to start this here
- can I start this now or will it clash with what is already going on
- what is everyone else working on in this workspace right now
- start this once the schema PR merges, do not wait around for it
- two of us are in this repo today, how do we not step on each other
- this needs the contract change to land first, set it up to begin then
- is anything in flight that touches the retention code

## Should not fire

- spawn three agents to do these pieces in parallel. That is `fan-out-work`, which owns
  work this session decided to split.
- which worktrees have uncommitted work. The audit belongs to `branch-to-pr`.
- what was I working on before the weekend. Resuming your own work is `handoff`.
- there are two ways of returning errors in here now. That is `consistency`, whatever
  caused the fork.
- resolve these merge conflicts. Ordinary git work, whoever created the conflict.
- get this PR green. Checks belong to `branch-to-pr`.
