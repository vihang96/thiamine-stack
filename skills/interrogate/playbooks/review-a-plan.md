### Review a plan

**Review it against the problem, not against the plan you would have written.** For a plan,
a design doc, an RFC, a spec, or a proposed sequence of steps, before any code exists.

This is the cheapest review there is. A wrong step costs a paragraph here and a week after
it is built. It is also the review most likely to degrade into two people trading
preferences, which is what the observation step below exists to stop.

1. Get the problem and the constraints first. What has to become true, what must not change,
   and what is fixed outside the plan's control. A plan reviewed against no problem
   statement gets rewritten toward the reviewer's taste, and both parties leave annoyed.
   If the plan does not state its problem, that is the first finding.

2. Check that the plan answers the question that was asked. A plan that opens with a chosen
   mechanism has usually skipped the question, and `pre-implementation` owns the difference.
   Name the problem the plan actually solves and ask whether it is the stated one.

3. Hunt the failures that are cheap now and expensive later.

   - **Unknowns treated as known.** Every step resting on an assumption about how the code
     behaves that nobody observed. This is the highest-yield finding in a plan review.
   - **Blast radius.** Callers, migrations, data already written in the old shape, other
     services reading the same table, anything that has to move with the change. A change
     to a published shape is the case to press hardest: name the consumers still on the old
     one, and what happens to them between the two deploys.
   - **No verification planned.** Which new paths get a test, which edge cases the plan
     names, and whether anything exercises the change in a real environment rather than
     only in unit tests. A plan that ends at "implement" has no point where it is wrong.
   - **Unverifiable sequencing.** A plan whose first checkable point is the end. Each step
     should have something you can run to know it worked.
   - **A step that is really five.** Usually the one phrased as "then wire it up".
   - **Partial failure.** What state exists if it stops after step three, and whether
     step three can be run twice.
   - **A second answer.** The plan introduces a library, a store, a pattern, or an error
     shape the codebase already decided. `consistency` owns this and is worth loading.
   - **Ungrounded conventions.** Read the `CLAUDE.md` that governs the code the plan
     touches, and the nearest existing feature of the same kind. A plan judged against
     remembered conventions rather than the ones in the repo produces confident, wrong
     findings, and the language standards own the code-level half of this.
   - **Order across repos.** Where the change spans repos, the repo publishing a contract
     lands first and the consumer names its number. A plan that lists the work without the
     order has not been sequenced, and `land-a-change` owns the mechanics.
   - **Work nobody asked for.** A refactor riding along, a config knob with no caller.

4. Ask for the observation rather than winning the argument. Where a step rests on how the
   code behaves, name the file to read or the command to run that would settle it. One
   command beats three rounds of reasoning, and a plan review that trades opinions costs
   more than the check would have.

5. Sweep every item in step 3 and record a verdict for each, including the ones that pass.
   A hunt list silently returns nothing for the item you forgot, and a plan review's most
   expensive failure is the criterion nobody applied.

   Scale it. A three-step plan gets the criteria applied and a one-line answer; the sweep
   report is for a plan long enough that a missed criterion could hide in it.

   Report it compressed. Findings in full, and the clean criteria as one line naming what
   you checked. A section per criterion saying "PASS" is padding by construction: it
   produces the same six headings whether the plan is sound or unread, which is what the
   line above is for.

6. Rank by what the plan costs if that part is wrong, not by how sure you are. A missing
   rollback outranks a mis-ordered pair of independent steps, even when the ordering is the
   thing you are certain about.

7. End on one of three decisions, and name it: **approved**, **needs revision**, or
   **blocked**. Needs revision names each item to address. Blocked names the one thing that
   makes implementation pointless until it is settled. An unranked list of concerns is not a
   decision, and a plan review that does not end in one gets read as approval.

**Reply:** the problem as you understood it, the decision of the three, each item to
address with what would close it, one line naming the criteria that passed, the unknowns to
observe before writing code, and what you did not check.
