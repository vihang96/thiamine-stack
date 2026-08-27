### Converge and prune

**Drop what stopped paying, and stop for a reason you can state.** For a plateau, a run with
several surviving variants, and deciding it is finished.

A run without pruning slows down as it goes, because every attempt is drawn from a pool that
still contains everything that has already failed.

1. Prune an exhausted category. Three attempts from one category, all rejected, means the
   category is done for this run. Record it as pruned in the log with the three attempt ids,
   so it is not rediscovered as a fresh idea in an hour or by the next session.

2. Prune a dominated variant. Where a run has produced several surviving states, one is
   dominated when another is at least as good on the objective and no worse on every guard.
   Drop it, whatever is appealing about how it works. Keep a variant that is worse on the
   objective only when it is genuinely better on a guard, and say which guard, because that
   is a trade for the user to make rather than for you to bank.

3. On a plateau, pivot once before concluding. In order of what pays: re-cluster the
   failures, since the distribution has moved and the queue is stale. Take a category you
   have not tried. Combine two near-misses that failed for different reasons. Re-read the
   thing you are optimising rather than reasoning about your model of it.

   A plateau is not a stop. Neither is it a licence to keep going forever, which is what
   step 6 is for.

4. Check the held-out set at each checkpoint, not each attempt. This is the moment a run
   finds out whether it has been learning the task or the set.

   When the climbing set improved and the held-out set did not, you have overfitted, and the
   accepted changes are worth less than the log says. Do not respond by tuning until the
   held-out set catches up, which is just overfitting to it more slowly. Respond by keeping
   only the changes with a mechanism that survives inspection, and by widening the data.

5. Re-check the degenerate solution you named when framing. By this point the run has been
   rewarded for whatever the metric rewards, and if it drifted toward the degenerate
   answer, the guards were the wrong ones rather than the run being wrong.

   Look at ten items by hand alongside the number. A metric agrees with you long after it
   has stopped tracking the complaint, and the only thing that catches that is looking.

6. Stop when one of these is true, and say which. The target was met on the held-out data
   and the attempt floor was cleared. The budget is spent. The remaining hypotheses are all
   marginal and you can name what they would be worth.

   Never by relaxing the target, never by widening a guard to admit the current state, and
   never while a cheap untried mechanism is sitting in the queue.

7. When the objective's target is met and a sequence remains, convert it into a guard at the
   level it reached, rewrite `card.md` for the next objective, and re-baseline. The run
   continues rather than ending, and the numbers from before the switch stay comparable
   because the harness did not move.

8. Close the run out. Delete the scaffolding, keep the harness if it is worth keeping and
   say so, and carry the accepted changes through review as ordinary work. The log dies with
   the run, and anything in it worth keeping is now either a change, a test, or a line in
   the standards.

**Reply:** baseline to final on both sets with the deltas, every guard's final value against
its floor, attempts kept, reverted, and pruned with what was pruned and why, which stop
condition ended it, and the best untried mechanism with what you think it is worth. Say
plainly if the held-out set disagreed with the climbing set.
