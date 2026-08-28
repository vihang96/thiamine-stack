---
name: experimentation
description: "Runs a sustained improvement loop against a measured objective, generating hypotheses from clustered failures and pruning what stops paying. Use for hill climbing, for tuning prompts or a system against a score, and for any run of many attempts where a number decides."
owns: "the sustained improvement loop: competing objectives, hypothesis generation, pruning, and convergence"
requires: [pre-implementation]
see_also: [fan-out-work, handoff, consistency, curator]
---

# Experimentation

A run of many attempts against a number. Not a fix, and not one measurement. The work is
keeping a search honest over dozens of attempts while it accumulates rather than circles.

Three things make it go wrong, and they are not the ones people prepare for. The metric
improves and the system gets worse. The search wanders because nothing recorded what already
failed. Progress on one number quietly destroys another, and nobody notices until it ships.

## One objective, everything else is a guard

This is the frame, and getting it right is most of the skill. Every measurable thing you
care about goes in exactly one of three places, written down before the first attempt.

| Tier | Meaning | What you do with it |
| --- | --- | --- |
| Objective | the one number you are moving | one, never two. Improving it is the run's purpose |
| Guard | must not get worse than a stated floor | measured on accept. A breach reverts the attempt |
| Ignored | deliberately out of scope for this run | named out loud, with the risk of ignoring it |

**One objective at a time.** Two objectives is not a harder run, it is an unmeasurable one,
because every attempt that trades one against the other needs a judgement nobody wrote down.

**A guard is not a second objective.** It has a floor and no target. You are not trying to
improve it and you do not celebrate when it moves up. It exists to catch the attempt that
buys the objective by wrecking something else.

**Ignored has to be populated.** If everything is a guard, every attempt costs a full
measurement sweep and the run stalls. Naming what you are not protecting is what makes the
run affordable, and stating the risk is what makes that honest.

## Objectives in sequence

Working on stability while worrying about accuracy is how neither gets done. So order them,
and work one at a time.

When an objective reaches its target, it does not get abandoned. **It becomes a guard at the
level it reached**, and the next objective becomes the one you move. Stability climbs to its
target, freezes as a floor, and accuracy becomes the objective, with the stability floor now
catching any accuracy win that reintroduces a crash.

Write the sequence down at the start. Reordering it mid-run is allowed and worth saying out
loud, because it is a change to what the run is for.

## Two regimes, and the loop differs in both

Whether the system under test is repeatable changes the harness, the stopping condition, and
what a plateau means. Decide which regime you are in at framing time, because retrofitting
it invalidates the numbers taken before.

You do not have to guess. Measuring the noise band answers it: run the harness twice against
an unchanged system, and if the answer differs, you are in the second column.

| | Repeatable | Stochastic |
| --- | --- | --- |
| Example | latency, error count, tests passing, bytes | anything with a model generating in the loop |
| A measurement is | one run | N runs, and the result is a distribution |
| A gain is | the number moved past machine noise | the distribution shifted, by a test rather than by eye |
| The default failure | a win here that does not hold in production | banking a win that was luck |
| A plateau means | pivot to another category | measure harder first, then pivot |
| Sample budget | not a constraint | the binding constraint, and it trades attempts against confidence |
| Stop when | the target is met, or the remaining ideas are marginal | the target is met with the interval clear of it, or the gap left is smaller than your budget can resolve |

Two consequences worth stating outright.

**A plateau in the stochastic regime is usually the measurement, not the hill.** With a wide
distribution and a small sample, real gains hide inside the spread. Increasing N is the
first response to a stall, and pivoting category is the second. Getting that order backwards
abandons a good direction because it was measured badly.

**Variance is often the thing you actually want.** Reliability and stability are questions
about spread, not about the average. A change that lifts the mean and doubles the spread has
made things worse for the user, who sees one run rather than your distribution. When the
complaint is "it works sometimes", the objective is the spread and the mean is the guard.

## The run card

One directory per run, at `<workspace>/.thiamine/experiments/<slug>/`.

`card.md` holds the frame in prose, rewritten as it changes: what is ignored and why, the
sequence, the harness command, the data split, and the stop condition. `metrics.tsv` holds the
machine-readable half, so a floor is checkable rather than remembered. `attempts.tsv` holds one
row per attempt, appended and never edited.

```
metrics.tsv   role       name          direction  threshold
              objective  iou           higher     0.90
              guard      cost_per_doc  lower      0.004

attempts.tsv  id  category  prior  hypothesis  change  before  after  guards  verdict  note
```

`category` is what pruning counts, so an attempt with no category cannot be pruned by streak.
`prior` is what you expected before running it, one of likely, unsure, or longshot. It is the
only way to find out later whether your predictions about this system are worth anything.

Both live outside the tree so they survive a revert, which is most of what they are for.
`handoff` owns the record of the session, which is a different question: what is in progress
and why. This is the record of the search.

Read `attempts.tsv` before every attempt. A search that does not read its own log repeats
itself, and the repeats are invisible because each one feels like a new idea.

## Procedure

1. **Frame the run**, per `playbooks/frame-the-run.md`. Objective, guards, ignored,
   sequence, stop condition. No attempt before this exists.

2. **Build the harness and split the data**, per `playbooks/build-the-harness.md`. Includes
   the two things a loop is worthless without: a held-out set you do not climb on, and the
   size of the noise band.

3. **Generate hypotheses from the failures**, per `playbooks/generate-hypotheses.md`. The
   `curator` agent does the reading and returns clusters ranked by how much of the
   gap each one owns. Turning a cluster into a hypothesis with a mechanism is yours, because
   it needs the system knowledge the agent does not have.

4. **Run the loop**, per `playbooks/run-the-loop.md`. One change, one measurement, keep or
   revert, log either way.

5. **Prune and converge**, per `playbooks/converge-and-prune.md`. Drop what stopped paying,
   check the held-out set, and stop for a reason you can state.

## Playbooks

| Situation | Playbook |
| --- | --- |
| Starting a run, or the goal is stated as several things at once | `playbooks/frame-the-run.md` |
| Before the first attempt, building what measures it | `playbooks/build-the-harness.md` |
| Out of ideas, or the ideas are all the same shape | `playbooks/generate-hypotheses.md` |
| Attempts are running | `playbooks/run-the-loop.md` |
| A plateau, a dominated variant, or deciding to stop | `playbooks/converge-and-prune.md` |

## Verify

```sh
node scripts/compare.mjs --paired baseline.txt variant.txt   # did this attempt move it
node scripts/compare.mjs --interval final.txt                # is the target actually met
node scripts/prune.mjs <run-dir>                             # what should be pruned, and what got overridden
```

A run is finished when the objective met its target on the **held-out** data rather than the
data you climbed on, every guard is inside its floor at the final state, and the attempts log
accounts for each attempt as kept, reverted, or pruned.

A number that only moved on the set you tuned against is not a result. It is the most common
way a tuning run reports success and ships a regression.

## Do not

- Chase two objectives at once. Sequence them, and convert each into a guard as it lands.
- Compare single runs of anything stochastic. One sample of an LLM is an anecdote, and the
  noise is routinely larger than the improvement being chased.
- Measure on the held-out set while climbing. Every look at it spends some of its power to
  tell you the truth at the end.
- Accept a win you cannot explain. A gain with no mechanism is usually the harness moving,
  the data leaking, or noise.
- Stack two changes because both looked promising. A win and a regression together read as
  nothing happened, and you learn neither.
- Keep a metric that has started to disagree with what people complain about. Say it is
  wrong, say what it misses, and re-frame.
- Relax the target or widen a guard to declare victory. Reordering the sequence deliberately
  is a decision. Moving a floor to admit the attempt in front of you is not.
