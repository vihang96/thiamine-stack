### Judge the overlap

**Decide from evidence whether starting now is cheaper than waiting.** For when something
else is in flight and you have to pick a route.

The whole judgement turns on one question. Does your work need the other work's **files**,
or its **answers**? Git merges text. It cannot merge decisions.

1. Read the other unit's entry, and its branch if one is pushed. What it says it `decides`
   matters more than what paths it lists.

2. Compare the questions before the files. If both units have to settle how an error is
   shaped, what a field is called, which library does a job, or where a check lives, you
   are decision-coupled and starting now means shipping two answers. Settle it first, which
   usually means reading what the codebase already does. `consistency` owns that, and it
   owns the case where the answer is already there and neither of you has to invent one.

3. Compare the blast radii, not the file lists. Run `pre-implementation`'s `blast-radius`
   playbook for your change, and read theirs from their branch if it exists. Intersect the
   two. The overlap that matters is rarely in either unit's stated paths: a shared generated
   client, a config key, a migration ordering, a fixture two tests both load.

4. Pick a route from the table in the skill, and say which and why. Textual overlap is the
   common case and starting is usually right, because resolving a conflict later costs less
   than the whole unit waiting. A conflict is a normal cost of two people on a repo.

5. Where the intersection is real and the cost is unclear, ask, and hand over the evidence
   rather than the question. The two blast radii and what each unit decides, then the
   options: start and rebase later, or wait for theirs to land. That is a cost and priority
   call, which is the user's, and everything leading up to it was yours to find.

   Do not stop while you wait. Write the question down with the answer you would take by
   default, do every part of the work that does not depend on it, and batch the ask into
   your next report.

6. If you start into textual overlap, say so in your entry. `paths` naming the shared file
   tells the other session that a conflict is coming, which is the difference between a
   rebase and a surprise.

7. Re-judge when the other unit lands. Their merge changes your base, and the overlap you
   assessed against their branch is now an overlap against the default branch.

**Reply:** what overlaps, whether it is files or answers, the route you picked and the cost
that justified it, and any question you parked with the default you would take. Name the
`file:line` or the decision the overlap turns on. Do not describe both units at length.
