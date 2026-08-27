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
     services reading the same table, anything that has to move with the change.
   - **Unverifiable sequencing.** A plan whose first checkable point is the end. Each step
     should have something you can run to know it worked.
   - **A step that is really five.** Usually the one phrased as "then wire it up".
   - **Partial failure.** What state exists if it stops after step three, and whether
     step three can be run twice.
   - **A second answer.** The plan introduces a library, a store, a pattern, or an error
     shape the codebase already decided. `consistency` owns this and is worth loading.
   - **Work nobody asked for.** A refactor riding along, a config knob with no caller.

4. Ask for the observation rather than winning the argument. Where a step rests on how the
   code behaves, name the file to read or the command to run that would settle it. One
   command beats three rounds of reasoning, and a plan review that trades opinions costs
   more than the check would have.

5. Rank by what the plan costs if that part is wrong, not by how sure you are. A missing
   rollback outranks a mis-ordered pair of independent steps, even when the ordering is the
   thing you are certain about.

6. End on a decision, in the plan author's terms: proceed, proceed with these changes, or
   not yet. "Not yet" needs the specific thing that is missing, and an unranked list of
   concerns is not a decision.

**Reply:** the problem as you understood it, the decision, blocking gaps each with what
would close it, the unknowns to observe before writing code, and what you did not check.
