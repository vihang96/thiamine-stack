# Trigger examples: interrogate

Prompts that must load this skill, and near-misses that must not.

## Should fire

- review this PR
- can you look over what the agent just wrote before I merge it
- here is the plan, tear it apart
- stress test this design and find the blind spots
- is this diff actually doing what the description says
- give me feedback on this RFC
- spawn a few reviewers on this branch and tell me what is real
- the subagent says it is done and tests pass, check that

## Should not fire

- address the review comments on my PR. That is the inbound direction, in
  `multi-repo-mechanics`, playbook `triage-review-comments.md`.
- is this ready to merge. Checks, conflicts, and the pull request state, so
  `multi-repo-mechanics`, playbook `shippable.md`.
- walk me through what you built. Whether the owner can explain their own change, so
  `post-implementation`.
- write the plan for this migration. Authoring rather than judging, so
  `pre-implementation`, playbook `plan-the-work.md`.
- clean up this function, it is too nested. Editing the code rather than reporting on it, so
  the `code-simplifier` agent.
- fix the type errors in this file. A compiler result, not a review.

## Fires alongside fan-out-work

Whenever review is spread across parallel reviewers. That skill owns the cut, the brief, and
the drain. This one owns what a reviewer is looking for, which findings survive, and how the
result reaches the author. The overlap is deliberate and named in both `## Scope` sections.

## Fires alongside the harness's own diff review

On any diff, in Claude Code. The built-in review is the bug hunt and runs first; this skill
supplies the intent, the claims, the ranking, and the verdict it does not produce. A review
that ran only one of the two says which.
