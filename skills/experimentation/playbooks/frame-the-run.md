### Frame the run

**Sort everything you care about into one objective, some guards, and the ignored, then write
it down before the first attempt.** For starting a run, and for a goal that arrived as
several things at once.

A request like "make the extraction better" or "make this more reliable" names a direction
rather than a run. The framing is what turns it into something that can succeed or fail.

1. Say what the goal is in terms of what someone noticed. Not "improve accuracy" but "the
   reviewer has to correct the totals on about a third of invoices". The complaint is what
   the metric has to track, and a metric chosen without it optimises something nobody
   mentioned.

2. List every measurable thing that matters, including the ones nobody raised. For a
   prompt: per-field accuracy, box overlap, refusal rate, latency, cost per document,
   output validity. For code: crash rate, error rate, tail latency, throughput, memory,
   test pass rate. The list is cheap now and expensive to discover mid-run.

3. Assign each one to a tier, and write the numbers.

   The objective gets a target and a direction. Choose it with
   `pre-implementation`'s `pick-a-metric` playbook, which owns making a single metric
   honest: reproduce the complaint first, measure what people feel, prove the ruler can see
   the problem. Everything in this step is what that playbook does not cover, which is the
   other metrics.

   Each guard gets a floor, and the floor is a number, not "should not get worse". Set it
   at the current measured value minus whatever you are genuinely willing to lose. A guard
   with no slack fires on noise and gets ignored within three attempts, which is worse than
   not having it.

   Everything else is ignored, and each one gets a clause saying what could go wrong. "Cost
   per document is ignored; a prompt that triples the context would not be caught here."
   That sentence is the whole value of the tier.

4. Order the objectives if there is more than one thing to fix. Put first whichever one
   makes the others measurable. Stability comes before accuracy because a system that
   crashes on a fifth of the set has no trustworthy accuracy number, and fixing that order
   the other way round means re-measuring everything later.

   Say for each one what converts it into a guard: the target it must reach, and the floor it
   holds afterwards.

5. Say which regime the system is in, because the stop condition below depends on it. If
   re-running the harness unchanged gives a different answer, it is stochastic, and every
   measurement from here is a distribution rather than a number. Where the complaint is that
   it works sometimes, say now that the objective is the spread rather than the average, with
   the average as a guard.

6. Set the stop condition, with a floor on attempts so a lucky early result cannot end the
   run, and a budget so a hopeless one does not run forever. Both numbers, agreed or stated.

7. Name the degenerate solution. For every metric there is a stupid change that improves it,
   and knowing it in advance is how you recognise it when an attempt finds it. One enormous
   predicted box improves recall. Refusing every uncertain document improves accuracy on
   what remains. Retrying forever improves the success rate and destroys latency. If the
   degenerate solution would pass all your guards, the frame is wrong and this is the
   cheapest moment to find that out.

8. Write `card.md`, and only then start.

**Reply:** the objective with its target and direction, each guard with its floor, what is
ignored and the risk of each, the sequence if there is one, which regime the system is in, the
stop condition, the degenerate solution you are watching for, and the card path. If the goal came in as two
objectives, say which one you put first and why.
