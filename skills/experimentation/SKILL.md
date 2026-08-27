---
name: experimentation
description: "Runs a sustained improvement loop against a measured objective: states the goal, isolates the one metric being moved from the ones that must only be held, generates hypotheses from clustered failures, and prunes what stops paying. Use for hill climbing, tuning prompts for accuracy or overlap scores, driving reliability or stability up, and any run of many attempts where a number decides."
owns: "the sustained improvement loop: competing objectives, hypothesis generation, pruning, and convergence"
requires: [pre-implementation]
see_also: [fan-out-work, handoff, consistency]
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

## The run card

One directory per run, at `<workspace>/.thiamine/experiments/<slug>/`.

`card.md` holds the frame, rewritten as it changes: the objective, the guards with their
floors, what is ignored, the sequence, the harness command, the data split, and the stop
condition. `attempts.tsv` holds one row per attempt, appended and never edited.

```
id  hypothesis  change  objective-before  objective-after  guards  verdict  note
```

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

3. **Generate hypotheses from the failures**, per `playbooks/generate-hypotheses.md`. Read
   what is failing and cluster it. The clusters are the hypotheses, and they arrive ranked
   by how much of the gap they explain.

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
node scripts/compare.mjs --paired baseline.txt variant.txt
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
