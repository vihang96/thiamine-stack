### Run the loop

**One change, one measurement, keep or revert, log either way.** For the body of a run.

The discipline is boring and every violation is expensive, because a loop that breaks it
produces numbers that cannot be attributed to anything.

1. Read `attempts.tsv` first. Every time. The whole point of the log is that attempt
   nineteen knows what attempt six found, and an idea that arrives feeling fresh is often
   one already tried under a different description.

2. Take one hypothesis. State before you change anything what result would confirm it and
   what result would kill it. An attempt with no failing outcome cannot teach you anything,
   because any number becomes evidence for something.

3. Make the smallest change that tests the hypothesis. Not the best version of the idea, the
   smallest one that would move the number if the mechanism is real. Refining comes after
   the mechanism is confirmed, and refining an idea that was never true is the most common
   way a run burns a day.

4. Measure the objective on the climbing set, and the cheap guards. Compare against the
   noise band rather than against the last number:

   ```sh
   node scripts/compare.mjs --paired baseline.txt variant.txt
   ```

5. Accept only when all three hold. The objective moved past the noise band. Every guard is
   inside its floor. The change has a mechanism you can state.

   A move inside the noise band is not a small win, it is not a result. Treat it as a
   reject and say so, because a run that banks noise accumulates a pile of changes that
   together do nothing and cannot be unpicked.

6. On accept, measure the expensive guards before committing. This is the moment the
   stability floor catches the accuracy win that reintroduced a crash, and it only works if
   it happens on accept rather than at the end.

7. On reject, revert in full. Nothing rides along because it "might help". A partial keep
   makes every later number ambiguous, and the ambiguity is not visible in the log.

8. Log the row either way, with the before, the after, the guards, the verdict, and one line
   of why. A rejected attempt is worth more than an accepted one, because it removes a
   branch of the search and nothing else records that.

9. Commit each accepted change on its own, staging by path. Never stage by wildcard: a run
   generates harness output, logs, and scratch files, and sweeping them into the commit is
   how a run's scaffolding ships.

10. Where several hypotheses are independent and each has its own mechanism, run them in
    parallel lanes rather than in sequence, per `fan-out-work`. Each lane needs its own
    worktree and its own harness output, because two attempts sharing an output directory
    produce one unattributable number. Accept them one at a time afterwards, re-measuring
    each against the current state, since two changes that each help can conflict.

**Reply:** per attempt, one line: the hypothesis, the change, before and after with the
noise band, the guards, and kept or reverted. Not a narrative. At checkpoints, the objective
from baseline to now, attempts kept against reverted, and what the log says you have ruled
out.
