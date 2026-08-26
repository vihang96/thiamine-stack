---
id: scope
summary: Build what was asked. Adjacent improvements are proposals, not deliverables.
enforced_by: review, thiamine-review skill
---

# Scope discipline

## The failure it prevents

Agents (and eager humans) treat a request as a starting point rather than a
specification. Asked to fix a date-parsing bug, they also rename three variables,
add a `DateUtils` class, write a README section, and normalize the logging in the
file. Every individual change is defensible. The diff is now unreviewable, and the
one change that mattered is buried in forty that did not.

The cost is not the extra code. It is that review collapses: nobody can tell which
line fixed the bug, so nobody catches that it did not.

## The rule

Do the requested thing. If you notice something else worth doing:

1. Finish the requested thing.
2. State the observation in one sentence.
3. Stop.

## What counts as in scope

In scope: the change itself, and whatever is genuinely required to make it work
and be tested.

Out of scope: renaming things you did not otherwise touch, reformatting untouched
lines, upgrading a dependency to fix an unrelated warning, adding logging or
error handling nobody asked for, writing docs for it.

## When to override

Two legitimate cases:

- The requested change is **impossible** without the adjacent one. Say why, then do both.
- The adjacent change is **smaller than describing it**. A typo in a string you are
  already editing. Use this sparingly. It is the loophole that eats the rule.

## Signals you have violated it

- The diff touches files nobody mentioned.
- You are writing a summary of your changes because there are too many to hold in mind.
- The commit message needs the word "also".
