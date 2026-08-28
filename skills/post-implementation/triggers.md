# Trigger examples: post-implementation

Prompts that must load this skill, and near-misses that must not.

## Should fire

- walk me through what you built
- explain this change, I have to defend it in review
- is this what I asked for
- we are adding a new service, the team needs to know
- draft something for the channel about this
- what decisions did you make that I should look at

## Should not fire

- is this ready to merge. That is the shippable playbook in land-a-change.
- how does the guide approval flow work. Understanding code you did not just write is
  investigation, in pre-implementation.
- get this PR green. Checks, so land-a-change.
- write the API reference for this module. Authoring a document, so technical-writing.
- remember that the team prefers short messages. A durable fact, so continual-learning.

## Fires alongside land-a-change

Both run at the end. This one asks whether the person understands and agrees. That one asks
whether the code is ready. Both have to be yes, and green checks on a change nobody can
explain is the case this exists for.
