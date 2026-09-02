# Trigger examples: signal-to-task

Prompts that must load this skill, and near-misses that must not.

## Should fire

- triage the sentry queue for this week
- there are 4,000 timeout errors and I have no idea where to start
- why is the export endpoint slow in production
- here is a cpuprofile from a customer, what is wrong with it
- go through the feedback channel and file whatever is real
- this error fires on every run and nobody looks at it, does it matter
- check last night's failed runs and tell me what should happen to them
- set up a daily pass over sentry and linear so this stops piling up

## Should not fire

- address the review comments on my pull request. Inbound comments on your own change, which
  is branch-to-pr's triage-review-comments playbook.
- reproduce this bug and fix it. The signal has already earned work, so pre-implementation
  owns the reproduction and branch-to-pr lands the fix.
- make the export endpoint faster, target p95 under two seconds. The metric and the baseline
  are pre-implementation's pick-a-metric, and a run of many attempts is experimentation.
- check whether this agent's report is actually true. That is an artifact somebody produced,
  which interrogate owns.
- write the runbook for this alert. Authoring a document, so technical-writing.
- what was I in the middle of yesterday. handoff owns the record of the session.
