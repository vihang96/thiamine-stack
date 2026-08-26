---
name: post-implementation
description: "Closes out a change after the code is written and before it lands: explaining it so the user can defend it, confirming each decision was the one they wanted, and getting buy-in from teammates with a summary, screenshots, or a demo. Use when a change is finished, when asked to explain what was built, or when a new feature or service needs the team behind it."
owns: "the user's understanding of a finished change, and the team's agreement to it"
see_also: [multi-repo-mechanics, pre-implementation]
---

# Post-implementation

An agent can produce a change nobody understands. It passes review because it looks
plausible, and the cost arrives later when it breaks and the person who owns it cannot say
what it was supposed to do.

This skill closes that gap. It runs after the code is written and before it lands, and it
ends when the person whose name is on the change can explain it and agrees with it.

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

`multi-repo-mechanics` owns whether the code is ready, through its `shippable` playbook.
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
