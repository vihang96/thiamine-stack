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

## Then hand the loop over

This playbook ends with a metric, a frozen harness, and a baseline. That is enough for a
single push, where one change is measured once and either helped or did not.

A run of many attempts is a different activity and the `experimentation` skill owns it: the
loop discipline, several competing metrics where one is being moved and the others only held,
generating hypotheses from what is failing, and pruning what stops paying. Reach for it as
soon as you expect more than a handful of attempts, or as soon as a second metric has to be
protected while you move the first.

**Reply:** the metric and the direction, the workload it is measured on, the harness command
and its noise floor, the baseline with the test run that accompanied it, and the stop
condition. Say whether one push or a run of attempts follows, since that decides who reports
the result.
