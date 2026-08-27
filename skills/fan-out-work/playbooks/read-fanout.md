### Read-only fan-out

**Nothing merges, so parallelise freely.** For investigating, searching, reviewing, or
sizing a change across many files or several repos.

This is the cheapest parallelism available and the most underused. There is no isolation to
arrange, no conflict to resolve, and no coherence pass, because no lane writes anything.
Reach for it before reaching for the write case.

1. Split by angle, not by directory. Lanes that each take a slice of the same question
   return overlapping halves of one answer. Give each a distinct question: the data model,
   the request path, the configuration, the tests. For a repo sweep, one lane per repo is
   usually the right cut because the repo boundary is where knowledge actually divides.

2. Send each lane the same grounding and its own question. They cannot see each other, so
   overlap is normal and better than a gap. Ask for file and symbol pointers rather than
   explanations, and forbid pasting file contents back.

3. Make the return small and structured. What it found, where, and what surprised it. The
   whole point is that the reading happened somewhere other than the parent's context, and
   a lane that returns a wall of quoted code has defeated that.

4. Reconcile contradictions rather than averaging them. Two lanes disagreeing about how
   something works means one of them is wrong, and finding out which is the highest value
   thing in the batch. Go and look.

5. Expect inflated findings when the lanes are reviewing rather than investigating. A
   reviewer with nothing serious to say will fill the space with nits, so a batch that is
   all nits means the code is fine and the right answer is to say so. Sort findings into
   what to act on, what to consider, and what you are dismissing, and keep the dismissals
   visible so the user can overrule you.

6. Say what nobody looked at. The gap in a parallel sweep is invisible, because every lane
   reports success at covering its own slice.

**Reply:** the question, the lanes and what each covered, one consolidated answer rather
than the lane reports, contradictions and how you resolved them, and what was not covered.
