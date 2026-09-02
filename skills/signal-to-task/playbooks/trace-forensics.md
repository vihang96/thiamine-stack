### Trace forensics

**The capture already exists, so read it rather than re-running it. Load it, shape it,
narrow to the cause, attribute to source.** For a profile, a distributed trace, a heap
snapshot, a spindump, a query plan, or a log bundle handed over with "why is this slow,
stuck, leaking, or wrong".

The artifact is a fixed dataset. That is the advantage: it can be queried, and the answer
does not move while you look at it. Keep the tooling generic, because the format outlives
whichever viewer you like this year.

1. Identify the format and open it with something that understands it. A profile or
   `.json.gz` trace in a trace viewer, a spindump in a text editor, a heap snapshot in heap
   tooling, a trace id in the tracing backend, a plan with the database's own explain output.
   Note the capture window and the load at the time, since a capture taken at 4am proves
   nothing about the 9am complaint.

2. Get it into a shape you can query before you start reading. One row per sample, span,
   frame, node, or log line, in sqlite or whatever queries locally. Reading a 200MB trace by
   eye finds the thing you expected. Querying it finds the thing that is there.

   Parse large artifacts in a subagent and keep only the reduced finding in the main thread
   (`fan-out-work`). A capture that fills the context window costs the rest of the triage.

3. Narrow to the cause. What you look for depends on the symptom:

   - Slow, single process: self time, not total. Total time up the stack tells you which
     entry point, self time tells you what to fix.
   - Slow, distributed: the critical path through the span tree, then whether the gap is
     work, waiting, or queueing. Serial spans that could overlap and N+1 fan-out both show
     up as a staircase.
   - Leaking: the retainer chain from the grown object to a GC root, and the allocation site
     with it. A count without a retainer is not a diagnosis.
   - Stuck: the thread that is on-CPU or blocked, and its wait reason. Then who holds what
     it is waiting for.
   - Wrong: the earliest span or log line where the state stops being right, not the last
     one before the error appeared.

4. Attribute it to source. File, symbol, and line, or service, endpoint, and query. A hot
   frame with no source mapping is not yet a diagnosis: resolve the symbols, or say plainly
   that the artifact does not carry them and what capture would.

5. Confirm it against a second capture. A paired before and after, or the same workload on
   a healthy instance, separates the regression from the background. With only one capture,
   report the strongest hypothesis the artifact supports and label it as one. Unpaired
   attribution is how a rewrite lands against a cost that was always there.

6. Hand back the diagnosis, no fix. This is read-only work, and it ends at
   `playbooks/route-it.md` with a cause attached.

Source: the trace-forensics and runtime-forensics playbooks in cursor/plugins `pstack`,
fetched 2026-09-01. The querying-before-reading step and the paired-capture rule are theirs.

**Reply:** the artifact and its format, the capture window, the reduced finding, the source
location, the artifact paths, and whether a second capture confirmed it or it stands as a
hypothesis.
