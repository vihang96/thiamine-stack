---
name: pre-implementation
description: "Prepares work before any code is written: understanding the code that exists, working out what breaks if you change it, and sorting unknowns into what to observe and what to ask. Use when starting a feature, a bug fix, a migration, or a performance push, for plan this out and mock something up, and whenever a request names a solution rather than a problem."
owns: "the phase before the first commit: what to build, what is unknown, and in what order"
see_also: [branch-to-pr, fan-out-work, working-alongside, experimentation]
---

# Pre-implementation

Most bad implementations are correct answers to the wrong question. The request arrives
naming a solution, the unknowns are never listed, and the first commit lands before anyone
has asked what would make the change wrong.

This skill owns the phase before that commit. It ends when you can say what you are
building, what you do not know, what it touches, and in what order it lands.

## Two rules that outrank the rest

**Take the problem apart before accepting the framing.** A request for a cache is a
statement that something is slow, and the cache is one answer. Ask what the request is
trying to achieve until you reach something that is true independently of the proposed
solution. Then decide whether the solution follows.

**Never ask a question you could answer by looking.** Reading the code, running the thing,
or building a throwaway sketch beats a question in almost every case, and it hands back a
result instead of a decision. `playbooks/prototype.md` is how you build the sketch. Reserve
questions for what only a person can settle: what the product should do, which tradeoff is
acceptable, what the deadline is.

## Scope

This skill owns deciding what to build and in what order. `branch-to-pr` takes it
from there, starting at worktree setup and running through to the pull request. The language
standards own the code itself.

Whether the steps can run at once is `fan-out-work`, which `playbooks/plan-the-work.md`
routes to once the order exists. Whether it is safe to start at all, given what another
session already has in flight, is `working-alongside`.

`playbooks/pick-a-metric.md` chooses the number and takes the baseline, which is where a
single performance push starts and ends. A sustained run of many attempts against that number
is `experimentation`, which owns the loop and the case where a second metric has to be held
while the first one moves.

It does not own the implementation plan surviving contact. When the plan is wrong, say so
and re-plan rather than following it off a cliff.

## What each kind of work needs

Preparation is not one size. Run the activities this work needs, and skip the rest.

| Work | Preparation |
| --- | --- |
| New feature | resolve unknowns, investigate, reference implementation, prototype when there is a design question, blast radius, plan |
| Bug fix | reproduce it first, investigate to the root cause, blast radius |
| Performance | reproduce it, pick a metric, and measure the baseline before changing anything |
| Tuning against a score | frame the objective and its guards, then run the loop in `experimentation` |
| Migration | investigate, blast radius, plan the phases and their order |
| Live testing | decide what you are proving and on which surface, before setting anything up |
| Spanning repos | blast radius and plan, always, because the order the pieces land in is the plan |
| Alongside other sessions | check what is in flight before planning, since it moves the blast radius |

## Playbooks

| Activity | Playbook |
| --- | --- |
| Listing what you do not know, and deciding what to observe versus what to ask | `playbooks/resolve-unknowns.md` |
| Understanding code that already exists, and where the gaps are | `playbooks/investigate.md` |
| Settling a design or a domain question with a throwaway | `playbooks/prototype.md` |
| Finding what a change breaks somewhere else | `playbooks/blast-radius.md` |
| Choosing the number that says whether it worked | `playbooks/pick-a-metric.md` |
| Sequencing the work across steps, repos, and pull requests | `playbooks/plan-the-work.md` |

Named in the table above but not yet written: reference implementation. Until it exists, do
that activity by hand and say you did.

## Ready to implement

You are ready when you can state all five without hedging:

1. The problem, in terms that do not name the solution.
2. What you do not know, and for each one whether you resolved it, are assuming it, or need
   an answer.
3. What already exists that you are building on or replacing, named by file and symbol.
4. What the change touches, including the repos and the callers you do not own.
5. The steps, in order, each ending in something you can check.

If any of these is missing, the next thing to do is find it, not to start typing.

## Do not

- Start implementing to find out what the requirements are. That is a prototype, and it is
  a different activity with a different standard, run in a scratch directory and thrown away.
- Ask the user a question that reading the code would answer. It is slower and it hands them
  work you were given.
- Produce a plan longer than the change. A plan whose steps are smaller than a commit is a
  way of avoiding the work.
- Carry an unknown into implementation silently. An assumption you name can be corrected. An
  assumption nobody sees becomes a bug with a plausible explanation.
