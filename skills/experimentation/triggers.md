# Trigger examples: experimentation

Prompts that must load this skill, and near-misses that must not.

## Should fire

- hill climb on the extraction prompt until the box overlap stops improving
- the reviewer corrects the totals on a third of invoices, systematically drive that down
- make this service reliable first, I do not care about latency until it stops crashing
- tune these prompts for accuracy but do not let cost per document run away
- keep trying until the error rate is under one percent, at least fifteen attempts
- I want stability sorted before we touch accuracy, set that up properly
- we have thirty ideas for improving this score, work through them and tell me what worked
- the accuracy went up on our test set but it is worse in production, what happened

## Should not fire

- make this endpoint faster. A single performance push is `pre-implementation`, whose
  pick-a-metric playbook owns choosing the number and taking the baseline.
- why is this test flaky. A bug with a cause, not a number to climb.
- mock up two designs for this screen. That is the prototype playbook in
  `pre-implementation`, settling a decision rather than moving a metric.
- spawn five agents to work on these repos. Parallelism is `fan-out-work`, which this skill
  uses for independent attempts but does not own.
- review this diff for bugs. The language standards own code review.
- write a test for this function. Ordinary work.
