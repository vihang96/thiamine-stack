---
name: post-implementation
description: "Closes out a change after the code is written and before it lands: explaining it so the user can defend it in review, confirming it is what they asked for, and getting teammates behind it. Use when a change is finished, for walk me through what you built or is this what I asked for, and when a new service needs the team to know."
owns: "the user's understanding of a finished change, and the team's agreement to it"
see_also: [land-a-change, pre-implementation, interrogate]
---

# Post-implementation

An agent can produce a change nobody understands. It passes review because it looks
plausible, and the cost arrives later when it breaks and the person who owns it cannot say
what it was supposed to do.

This skill closes that gap. It runs after the code is written and before it lands, and it
ends when the person whose name is on the change can explain it and agrees with it.

## When there is no gap to close

The walkthrough exists to close the gap between the change and what its owner understands.
Where there is no gap, running the full pass spends their attention on a change they
specified themselves.

Skip to a single sentence when all three hold:

- They specified the change at the level it was made. They named the line, and that line
  changed.
- It made no decisions. No choice between two shapes, no assumption, no tradeoff taken.
- It exposes nothing new to anyone else. No new endpoint, flag, or exported type, and no
  behaviour a caller depends on.

The sentence still says what changed and what you ran, because "done" on its own is the
claim `rules/RULES.md` forbids.

Two things never scale down. Confirm a decision you made and they did not, however small
the diff, since they are the one review will ask. And anything outward-facing goes through
`playbooks/socialize.md`, which cannot be taken back once sent.

## Explain, do not quiz

Testing recall is the wrong instrument. "Do you understand the retry logic" is
condescending, and an answer either way tells you nothing about whether the change is what
they wanted.

Present the decisions instead. "We chose a nullable column over a separate table, because
one policy per workspace made the join not worth it. Is that right?" That is answerable, it
surfaces disagreement while it is still cheap, and it produces the sentence they will need
in review.

So: explain plainly, then confirm each decision. Never set a test.

## Scope

This skill owns whether the person understands and agrees.

`land-a-change` owns whether the code is ready, through its `shippable` playbook.
The two are different questions and both have to be yes. Green checks on a change nobody
can explain is the failure this exists to catch.

`technical-writing` owns the prose of anything written here. `handoff` owns the record kept
during the build, which is where the decisions being confirmed should already be listed.

## Playbooks

| Situation | Playbook |
| --- | --- |
| The user needs to understand what was built | `playbooks/explain-the-change.md` |
| Checking each decision was the one they wanted | `playbooks/confirm-decisions.md` |
| A new feature or service needs the team behind it | `playbooks/socialize.md` |

## Do not

- Announce that the change is complete before the person who owns it can explain it. They
  are the one who will be asked in review.
- Post anything to a shared channel without showing the exact text first and being told to
  send it. That is outward-facing and cannot be taken back.
- Treat silence as agreement. A decision nobody responded to is unconfirmed, and saying so
  is more useful than assuming.
