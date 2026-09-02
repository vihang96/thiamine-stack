### Runtime forensics

**Instrument the live process. Do not theorise from source.** For "it is slow, spinning,
leaking, or wedged right now", an intermittent fault nothing has captured, and any item
where the code reads fine and the behaviour is wrong.

The process running in front of you is the only witness you can question. Code answers what
should happen. The process answers what is.

1. Capture the signal that matches the symptom, on the machine or service where it is
   happening. A CPU profile for something spinning, a heap snapshot pair for a leak, a trace
   for latency, thread or stack dumps for a wedge, the connection and lock tables for a
   database that has stopped. A real artifact, not a guess about which one would have been interesting.

   Two things to record with it, because they are gone the moment you look away: the load and
   the deploy version at capture time, and whether the symptom was occurring while you
   captured. A profile of a healthy minute is a common and expensive mistake.

2. Reduce it to one mechanism, per `playbooks/trace-forensics.md`, which owns the reading.
   Everything from step 2 of that playbook applies here once the artifact exists.

3. Prove the mechanism before believing it. This is the step that separates this playbook
   from reasoning, and skipping it is how a plausible cause gets filed while the real one
   sits one layer over.

   Intervene as cheaply as the environment allows: flip the flag, drop the cache, run the
   query with the plan attached, add one log line at the allocation site, break the retry
   loop, throttle the client. A prediction that holds under intervention is a cause. One
   that only explains the artifact is a story that fits.

   Never trade proof for privacy: the instrumentation you add can print a shape, a count, or
   a length, and never a token, a credential, or a customer's row (`rules/why/secrets.md`).

4. Take a second observation of the same kind. Intermittent faults reproduce on a schedule
   that flatters whatever you changed last. Two occurrences with the same mechanism, or one
   occurrence you can trigger, is the bar.

5. Leave the system as you found it. Every probe, flag, log line, and hotfix you added is now
   an undeclared change on a running system. Remove them, or land them deliberately through
   `branch-to-pr`, and say which. Debug instrumentation left on production is a defect that
   arrives later with no author.

6. Hand back the diagnosis, no fix, and route it through `playbooks/route-it.md`. A mechanism
   you proved usually changes the verdict, most often from `watch` to `fix now`.

**Reply:** the signal you captured and the conditions you captured it under, the reduced
finding, how you proved the mechanism and what the intervention did, the source location,
the artifact paths, and confirmation that everything you injected is gone.
