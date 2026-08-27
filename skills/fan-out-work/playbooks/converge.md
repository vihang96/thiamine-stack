### Converge

**Make the pieces add up before any of them lands.** For when the lanes have finished and
there are several results to turn into one change.

Every lane can pass its own checks and the result still be wrong, because each lane was
only ever asked about itself. Three things get checked here, and only the first was already
done per lane.

1. Confirm each lane has a verdict from something that did not write the code. A lane's own
   report that it passed is evidence, not a verdict. The independence that matters is a
   fresh context: an agent that never saw the reasoning behind the code, handed the code and
   told to try to refute it. Model family is not the mechanism, and cannot be relied on in
   most harnesses.

   Grade the verdict rather than treating it as a boolean. It builds, its tests pass, the
   real thing was exercised, the flow works across repos. Anything that changes behaviour
   cannot pass on the first level, and continuous integration passing is an input to a
   verdict rather than a verdict.

   Pin each verdict to the commit it was made against. A rebase or a fix invalidates it
   without touching a single check, and `git patch-id` is how you tell whether the content
   actually changed or only the SHA did.

2. Check the union for coherence. This is the step nothing else covers and the reason a
   fan-out can produce work that reads like several people.

   ```sh
   sh scripts/union.sh <lane-worktree> [<lane-worktree> ...]
   ```

   It prints per lane a shortstat, the files touched, and the names introduced, and
   deliberately not the diffs. Delegate the judgement to the `coherence-reviewer` agent
   with that output, because reading every lane's diff in the parent spends exactly the
   context the fan-out was meant to save.

   What it is looking for: two lanes that added the same helper under different names, two
   lanes that answered one question differently, a stub one lane invented for another
   lane's contract, and naming that drifted between lanes. `consistency` owns what to do
   about a divergence once it is found.

   A finding goes back to the lane that owns the code as a fix unit with its own brief. Do
   not reconcile it in the parent, and do not let the lane that happens to merge second
   absorb it silently.

3. Land in the order the cut recorded, not the order the lanes finished. Where a lane
   publishes a contract another consumes, the contract lands first, whatever finished first.
   `multi-repo-mechanics` owns the pull requests and the checks from here.

4. Verify the integrated behaviour as its own unit, with its own brief and its own verdict.
   Every lane passing does not mean the whole works, and as a phase at the end of a
   fan-out this is the check that never happens. Give it an owner.

5. Clean up. Remove the worktrees the fan-out created, per `multi-repo-mechanics`, and
   delete the fan-out's own working files. Check the audit for anything flagged dirty or
   unpushed first, because a lane that half-finished holds work in exactly one place.

**Reply:** each lane with its verdict and the level of that verdict, what the coherence pass
found and where each finding went, the landing order and how far it got, the integrated
check and its result, and what is left. Say plainly if a lane landed without an independent
verdict, since that is the thing a reader will assume did not happen.
