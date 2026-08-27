### Drain and track

**Treat completions as a queue, not as interrupts, and judge a quiet lane by what it wrote
rather than by asking it.** For the stretch between spawning and converging.

Two failures happen here. The parent context-switches on every arrival and stops making
progress, or it waits politely on a lane that died an hour ago.

1. Collect completions, do not process them. When a lane returns, record its verdict,
   branch, and head SHA, and go back to what you were doing. Never read a diff inside a
   drain: a completion that needs review becomes its own unit with its own brief.

2. Drain in batches at real boundaries. When you finish a critical section, when you need to
   spawn the next wave, and before reporting to the user. Arrivals during a drain wait for
   the next one.

3. Probe a quiet lane read-only. Pushed branches, commits on disk, files written, pull
   request state. **Never resume a subagent to check on it**, because a resume restarts an
   idle agent and you lose whatever it was holding.

4. Judge progress by side effects only. A lane that has passed its timebox with nothing
   written is stuck, whatever its last message said. Stand it down and respawn with smaller
   scope rather than waiting for it to return politely.

5. Retry by failure mode, and cap it. A lane that ran out of room gets respawned with a
   smaller scope. A lane that hit a transient tool or network failure gets retried as-is.
   Two attempts, then drop the unit and re-plan around it. Silently redoing a missing
   lane's work hides both the spend and the coverage gap.

6. Require each lane to externalise as it goes. A branch pushed, a file written, a test run
   recorded. Work that exists only inside a subagent's context when that subagent ends was
   never done, and this is the most common way a fan-out loses a whole lane's output.

7. Reconcile a late lane against the world it returns to. A lane that arrives after its
   siblings landed was written against a base that no longer exists. Re-check it before
   accepting anything, and take its findings through a fresh unit rather than merging it
   blind.

8. Account for every lane you spawned. Arrived, retried, stood down, or absorbed into
   another unit. A lane nobody can account for is either lost work or duplicated work.

**Reply:** at each drain, the lanes and their state, what changed since the last drain, and
anything waiting on the user. Counts and verdicts, not a narrative of arrivals.
