### Cut the work

**Prove the units can run at once before spawning anything.** For deciding whether a piece
of work is a fan-out at all, and if so how many lanes it has.

The cut is the whole quality of a fan-out. A good cut makes converging trivial. A bad one
produces five diffs that each work and a codebase that reads like five people.

1. Name the units. A unit is the smallest piece that ends in a check you can run. If you
   cannot say what check ends it, you do not have a unit yet, and
   `pre-implementation`'s `plan-the-work` playbook is where that gets fixed.

2. Classify the coupling between each pair of units. Four kinds, and only two of them can
   run at once:

   | Coupling | What it looks like | Treatment |
   | --- | --- | --- |
   | Disjoint | different files, no shared question | parallel, nothing to reconcile |
   | Textual | same files, unrelated intent | parallel, resolve conflicts at merge |
   | Decision | both must answer one design question | settle the answer first, then parallel |
   | Sequential | one consumes the other's output | not parallel |

   Decision coupling is the one worth dwelling on, because it is removable at a price you
   can pay up front. Two lanes that both have to decide how an error is shaped will decide
   it differently. Settle it, write it into both briefs, and they become disjoint. Most
   "this cannot be parallelized" is really "the contract has not been agreed yet", and
   `consistency` owns finding whether the answer already exists.

3. Apply the filter that outranks the table. **Can this unit be verified without a
   sibling?** If checking lane B means waiting for lane A to land, B is a step rather than
   a lane, however disjoint its files look.

4. Intersect the blast radii. Run `pre-implementation`'s `blast-radius` playbook per unit,
   then compare the results pairwise. The intersection is where the conflict will actually
   happen, and it is usually somewhere neither unit's file list mentions: a shared
   generated client, a config key, a database column, a fixture.

   Where the intersection is non-empty and you cannot tell whether it matters, say so and
   ask, with the two blast radii as the evidence. That is a cost and priority judgement
   rather than something reading more code would settle.

5. Separate the two orderings. Lanes can all run at once while their results land in a
   strict order. A service and the contract it consumes are parallel to write and
   sequential to merge. Write the landing order down now, because after five lanes finish
   nobody remembers it.

6. Pick the number of lanes from the units, not from the machine. The ceiling is however
   many results you can converge and the user can accept. Three that converge cleanly beats
   eight that arrive as eight review surfaces, which is a queue rather than a factory.

7. Say what you are not parallelizing and why. The unit you left sequential is the decision
   most likely to be wrong, and it is invisible in the result.

**Reply:** the units with the check that ends each one, the coupling between them, the
landing order, the number of lanes and why that number, and any overlap you want a
judgement on before starting. If the answer is that this should run serially, say that
plainly and stop here.
