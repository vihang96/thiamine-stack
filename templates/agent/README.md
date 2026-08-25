# Agent template

Copy to `agents/<name>.md`. Agents are subagents the main loop can delegate to.

## When an agent is the right tool

Use an agent when the work is **read-heavy and the conclusion is small**. That covers
sweeping many files to answer one question, reviewing a diff from one fixed perspective,
and verifying a claim independently. The win is that the file dumps stay out of the
parent's context.

Do not use an agent for work that needs conversation with the user, or for a task
where the parent will just have to re-read everything anyway.

## The two things people get wrong

**Vague return contract.** The parent receives only the agent's final message. If you
do not specify the shape and length, you get an essay when you wanted three file paths.

**No disposition.** "Review this code" produces agreeable review. "Try to refute this
claim. Default to refuted if uncertain" produces useful review. State the stance.
