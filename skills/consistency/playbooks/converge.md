### Converge

**Pick which answer is canonical, write it down, and migrate on a schedule rather than on
discovery.** For finding several answers to one question, and for being asked to clean up an
inconsistency.

The failure here is not leaving the divergence. It is converging opportunistically, halfway,
so the codebase ends up with three patterns and a migration nobody finished.

1. Count what actually exists before deciding anything. Every distinct answer, how many call
   sites each has, which is newest, and which the tooling already supports. A pattern with
   one call site and a pattern with two hundred are not two options, they are a default and
   an exception.

2. Pick the canonical one on cost to converge, not on merit. The best pattern with two call
   sites usually loses to the adequate one with two hundred, because the migration is the
   real expense and it lands on people who did not choose it. Where the popular answer is
   genuinely wrong, say what it costs to keep and let someone decide with the number in
   front of them.

3. Record it before migrating anything, with `playbooks/record-the-decision.md`. An
   unrecorded convergence is a preference, and the next person to arrive will diverge again
   with just as much confidence.

4. Do not migrate as part of unrelated work. It doubles a reviewable diff and mixes a
   behavior change with a mechanical one, which is exactly what the one-concern-per-commit
   rule exists to stop. The exception is a file you are already substantially rewriting.

5. Make the old pattern hard to reach for. A lint rule, a banned import, a deleted export, or
   at minimum the record. Converging without closing the door means converging again later,
   because the next person will find the old pattern and copy the nearest example.

6. Say what remains. The call sites still on the old pattern, and either when they move or
   that they are staying. A migration reported as done while forty call sites remain is worse
   than one reported as started, because nobody checks a finished job.

**Reply:** each answer with its call-site count and where it lives, which one is canonical
and the cost that decided it, the path to the record, what you closed the door with, and what
is still on the old pattern. Do not claim the codebase is consistent unless you counted.
