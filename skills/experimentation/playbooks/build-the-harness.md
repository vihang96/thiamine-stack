### Build the harness

**Split the data, measure the noise, prove the ruler can see, then freeze it.** For the step
between framing a run and the first attempt.

`pre-implementation`'s `pick-a-metric` playbook owns the metric and the sensitivity check.
This playbook owns the three things a repeated loop needs that a single measurement does not.

1. Split the data before the first attempt, and write the split into `card.md`.

   The set you climb on and the set you check on have to be different, because a loop of
   thirty attempts against fifty documents will find what is peculiar to those fifty. Aim
   for the held-out set to be large enough that a real gain shows up in it, and stratify it
   so both halves contain the awkward cases rather than concentrating them in one.

   Look at the held-out set at checkpoints, not every attempt. Every look spends some of
   its ability to tell you the truth at the end, because you start choosing what survives
   it.

   Where the data is a stream rather than a fixed set, split by time instead and check on
   the later period. Splitting a time series at random leaks the future into the past.

2. Measure the noise band before measuring any improvement. Run the frozen harness against
   an unchanged system several times and record the spread.

   This is the step people skip and it invalidates everything after it. With anything
   stochastic, the spread is routinely larger than the improvement being chased, so a
   single before-and-after pair is not evidence of anything. Anything inside the band is not
   a result whatever it looks like.

   ```sh
   node scripts/compare.mjs --paired baseline.txt variant.txt
   node scripts/compare.mjs before.txt after.txt        # unpaired
   ```

   Use paired mode whenever both runs cover the same items, which is the usual case when
   scoring the same documents under two prompts. It is far more sensitive than comparing two
   medians, because it looks at each item's own change rather than at the aggregate.

3. Emit the per-item scores, not just the aggregate. One number per attempt tells you it got
   better. Per-item scores tell you which cases got better, which is what
   `playbooks/generate-hypotheses.md` needs and what makes the next attempt more than a
   guess. This is the highest-value thing the harness can do and it costs almost nothing.

4. Measure the guards too, with the cheap ones on every attempt and the expensive ones on
   accept. Say which is which in `card.md`. A guard nobody can afford to measure is not a
   guard, it is a hope, and it belongs in ignored where it will at least be honest.

5. Freeze it, and make it one command. Every number in the log is comparable only to numbers
   from the same harness, so a change to it invalidates the run's history. When you must
   change it, re-baseline everything and say so in the log rather than comparing across the
   change.

6. Record the baseline: the objective on both sets, every guard, and the noise band. With a
   passing test run beside it, since a baseline taken from a broken system measures nothing.

**Reply:** the harness command, the split with the size of each half and how you stratified
it, the noise band and how many samples produced it, the baseline for the objective and every
guard, and which guards are measured per attempt against on accept.
