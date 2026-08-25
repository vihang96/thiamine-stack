---
name: <kebab-case-name, must match the directory name>
description: <Third person, and it must name the triggers. This is the only text the agent sees when deciding whether to load the skill. "Use when ..." earns its keep here.>
# requires: [other-skill]   # hard dependency; missing one is an error
# see_also: [peer-skill]    # cross-reference; still works alone
# owns: <what this skill is authoritative for>   # optional; prevents overlap with siblings
---

# <Title>

<One paragraph: what this accomplishes and the shape of the approach.>

## When this applies

<The concrete situations, specific enough to tell yes from no. Skip this section if
the description already covers it and there is nothing to add.>

## Procedure

1. <Imperative. Address the agent: "Run", "Read", "Ask".>
2. <Each step should be checkable, so the agent knows when it is done.>
3. <Name the failure mode at the step where it happens, not in a preamble.>

## Verify

<How to know it worked. Name the command or observation. A procedure with no
verification step produces confident, unchecked claims.>

## Do not

- <The failure modes specific to this procedure.>

## References

Read these only when the situation calls for them.

- `references/<topic>.md`. <The condition that makes it worth reading.>
