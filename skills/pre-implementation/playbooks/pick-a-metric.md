### Pick a metric

**Choose one number, prove the ruler can see the problem, and record the baseline before
changing anything.** For "make X faster", "reduce Y", and any work whose success is a
quantity rather than a behavior.

Without this, improvement is a feeling. With a bad metric it is worse than a feeling,
because the number agrees with you.

1. Reproduce the complaint first. Find a case that shows the problem, on a workload someone
   actually runs. If nothing reproduces it, fix that before going further. Optimising
   against a case you cannot reproduce improves a number nobody was complaining about.

2. Pick one number, and say which direction is better. One, not a dashboard. Where several
   matter, name the one you are moving and the others as constraints that must not get
   worse. A change that improves three metrics and quietly ruins a fourth is how a
   performance push ships an outage.

3. Measure what people feel, not what is easy to measure. The available counter is rarely
   the experience. Time to first useful output beats total runtime when the user is
   watching, and a tail beats an average whenever anyone is waiting. An average hides the
   slow requests, which are the ones being complained about, so reach for a high percentile
   by default.

4. Set the stop condition before starting. A target and a floor on attempts, so a lucky
   first result cannot end the run. Something of the shape at least thirty percent better
   than baseline, and at least eight attempts. Agree the numbers with whoever asked, or
   state the ones you chose.

5. Build the harness, then prove it can see. Run it against a case you know is slow and one
   you know is fine. If the ruler cannot separate them, the ruler is wrong and no amount of
   optimising will fix that. This step catches the metric that measures setup cost rather
   than the work.

6. Freeze the harness. One command, sampled enough to clear the noise, a median rather than
   a single run. Note what the noise floor is, since a change smaller than it is not a
   result. Changing the harness later invalidates every number taken before, so if you must
   change it, re-baseline and say so.

7. Record the baseline and a green test run before touching anything. The baseline is worth
   nothing without the tests that say the system still worked when you took it.

## Running the loop

The metric only means something if the loop respects it.

- One change, one measurement, keep or revert. Never stack two untested changes, because a
  win and a regression together read as no change.
- Never claim an improvement from reading the code. The data decides.
- Ground each attempt in a mechanism. "Defer this off the startup path because it blocks
  first paint" is a hypothesis. "Try memoising something" is not.
- Log every attempt, kept or reverted, with the before, the after, and one line of why. Keep
  it outside the tree so it survives a revert. It is what stops the run circling back to an
  idea already tried.
- Correctness and simplicity outrank the number. Revert a win that breaks behavior. Keep a
  simplification that holds the number.
- Do not relax the target to declare victory, and do not stop while cheap untried ideas
  remain. If you are stuck, say so rather than spinning.

**Reply:** the metric and the direction, the workload it is measured on, the harness command
and its noise floor, the baseline with the test run that accompanied it, and the stop
condition. Once the loop has run, add baseline to final with the delta, how many attempts
were kept against reverted, and the best idea you would try next.
