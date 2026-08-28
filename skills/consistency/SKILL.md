---
name: consistency
description: "Finds the answer a codebase already has for a concern before adding another one, and records the decision in an ADR when there is none. Use when introducing a pattern, choosing a library, a database, or a store, starting a new service, styling a new surface, asking how other services here already do it, or when a codebase has grown several answers to one question."
owns: "how many answers a concern is allowed, and where that decision is written down"
see_also: [pre-implementation, branch-to-pr, working-alongside, fan-out-work]
---

# Consistency

The Nth answer to a concern costs more than its merits. A second date library, a third way
to return an error, a fourth spacing scale: each one is defensible where it was added, and
together they mean nobody can answer a question about the system without checking which
version they are looking at.

This is not about duplication. Two copies of the same thing are one fix. Two different
answers to the same question are a fork, and it stays forked until somebody decides.

Applies twice. Before implementing, so you use what exists rather than inventing beside it.
During implementation, when you find that the thing you assumed was consistent is not.

## The rule

Find the existing answer before adding one. If there is none, choose deliberately and
record the choice. If there are several, say which is canonical before writing the next
line of code that depends on the answer.

Consistency has value independent of which option is better. A worse pattern used
everywhere is usually cheaper than a better pattern used once, because the reader learns
one thing rather than two and the tooling has one shape to support.

Converge the structure, not every line. Types and data models are what should agree, since
a second shape for one concept forces every reader to learn both and every function to
handle either. Three similar statements are fine and usually better than the abstraction
that would unify them. This rule is about the model, not about repetition.

## Scope

This skill owns how many answers a concern is allowed, and where that decision lives.

`rules/RULES.md` owns duplication, which is the same answer written twice. This owns
divergence, which is different answers to one question, and the two need opposite fixes.
Deleting a copy is safe. Deleting a divergent pattern is a migration.

`pre-implementation` owns understanding the change in front of you. This owns whether the
approach it takes matches what is already there.

Writing the record is a document, so `technical-writing` owns its prose and its mode. A
decision record is explanation, not reference.

## Where divergence grows

These are the concerns that accumulate answers. When a change touches one, ask the question
in the second column before choosing anything.

| Concern | Ask |
| --- | --- |
| Visual design | is there already a token, a component, or a scale for this |
| Data storage | which store do services of this shape use here, and why that one |
| Schema change | how does a migration ship in this repo, and who runs it |
| Error contracts | how does a caller learn what failed, and can it branch on it |
| Auth | where is the check, and what does it read |
| Logging and telemetry | what fields, under what names |
| Config and secrets | where does a value come from at runtime |
| API surface | how are resources named, how is a page requested, how is an error shaped |
| Retries | what makes an operation safe to repeat here |
| Build and release | how does this get tested and shipped |

The list is not complete and will not be. The test is whether a reader would expect two
parts of the system to answer the question the same way. If yes, it belongs here.

## Playbooks

| Situation | Playbook |
| --- | --- |
| About to introduce a pattern, pick a library, or style a new surface | `playbooks/survey-first.md` |
| No existing answer, or a deliberate departure from one | `playbooks/record-the-decision.md` |
| Found several answers to one question | `playbooks/converge.md` |

## Across a workspace

A workspace of sibling services is where divergence is cheapest to create and most
expensive to live with. Nothing stops one service picking a different store, a different
error shape, or a different spacing scale, and no compiler ever notices.

`branch-to-pr` establishes that one change spans several repos on one branch. This skill
adds what those pieces owe each other: the two sides of a change answer a shared question the
same way, or the difference is deliberate and written down. A service change and its contract
change that disagree about how an error is represented have shipped the fork rather than the
feature.

Frontend services share a design system or they do not have one. Two applications with their
own spacing scales and their own button are two design systems, whatever the shared package
is called, and users see the seam before any engineer does.

The record for a decision every service inherits cannot live in one service's repo, because
nobody reads a sibling's docs before making a local choice. Put it where all of them can see
it, whether that is a shared repository, the workspace root, or the standards this stack is
installed from. A cross-service decision recorded in one service is a decision the other nine
will each make again.

## Look at what is in flight, not only what is committed

Searching the codebase finds the answers that landed. It cannot find the answer another
session or another parallel agent is deciding right now, and that one will land before
yours does. Two units of work each choosing how an error is shaped both pass review and
ship the fork.

So when the concern is one from the table above, check the work in progress too. The board
in `working-alongside` records what each unit of work decides, and `fan-out-work` settles a
shared question into every brief before its lanes start rather than letting each lane
answer it. Where a unit in flight has already decided your question, take its answer or
agree a different one with it, and do not decide independently and reconcile later.

## A new service is the hard case

A new service has no existing answers of its own and inherits every question at once. Do
not treat that as freedom. Survey the siblings first, take their answers by default, and
write down only the places you depart and why. A service that answers ten questions
differently from its neighbours is ten migrations nobody scheduled.

Where there is genuinely no precedent, exhaust the space before committing, using
`pre-implementation`'s prototype playbook. Then record it, because you are creating the
precedent the next service will inherit.

## Do not

- Add the better pattern beside the worse one and leave both. That is the fork, and it is
  the most common way this rule gets broken by someone trying to improve things.
- Spread a new capability across callers as special cases. Each site handles its own corner,
  the concept lives nowhere, and the shape only becomes visible once it is expensive to
  change. An increment should land one coherent thing or deepen one that exists.
- Start a migration you were not asked for because you found an inconsistency. Record it,
  say what converging would cost, and carry on with the work you have.
- Write a decision record for something nobody would ask twice. A record that answers a
  question no one has is ceremony, and it makes the useful ones harder to find.
