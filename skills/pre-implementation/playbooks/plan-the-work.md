### Plan the work

**Sequence the change into steps that each end in something you can check, ordered so the
sequence proves itself.** For multi-step work, anything spanning repos, and any change too
large to land in one pull request.

1. Start from what it touches. List the files, the callers you do not own, the repos, and
   the data. A step that turns out to touch a second repo halfway through is a re-plan, and
   re-planning mid-implementation is where scope quietly doubles.

2. Cut at the seams where something becomes checkable. A good step ends with a test that
   passes, a command that prints the right thing, or a behavior you can exercise. A step
   ending in "and then the next part will use it" is not a step, it is half of one.

3. Order by dependency, not by interest. Where one repo publishes a contract another
   consumes, the contract lands first. Where a migration adds a column and then backfills
   it, those are separate steps with a deploy between them. Write the order down, because
   in a workspace the order is most of the plan.

4. Make each step landable alone. Ask what happens if the work stops after step two.
   If the answer is that the system is broken or a half-built feature is exposed, the cut
   is wrong. Put the switch that turns it on last.

5. Say what you are not doing. The adjacent work you noticed and deliberately left out,
   named, so nobody has to guess whether you missed it. This is what stops a reviewer asking
   for it and stops you drifting into it.

6. Keep the plan shorter than the change. Steps smaller than a commit are a way of avoiding
   the work. If the plan is longer than the diff will be, the change is simple and does not
   need one.

7. Re-plan when it is wrong rather than following it. A plan is a prediction. When step
   three turns out to be impossible, say so and re-cut, rather than forcing the original
   shape and calling it done.

**Reply:** the steps in order, each with what it changes, which repo it lands in, and what
check ends it. Name the dependencies between steps, what you left out, and where you expect
the plan to be wrong. Do not restate the whole design as prose.
