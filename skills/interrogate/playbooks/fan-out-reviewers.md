### Fan out reviewers

**Fresh context is the mechanism, not the parallelism.** For high-stakes changes, for a
harness with no built-in diff review, and for "tear this apart" or "find the blind spots".

This is the heaviest shape in the skill, so check the floor in `SKILL.md` before reaching
for it. A small reversible diff has few angles to take, and spawning six reviewers over it
returns six reviewers' worth of nits.

A reviewer that shares the author's context inherits the author's blind spots. That is the
whole reason to spawn one, and the reason a second pass in the same session is worth less
than a first pass somewhere else. `fan-out-work` owns the mechanics, and its
`playbooks/read-fanout.md` is the general shape; this covers what is specific to reviewing.

1. Package the grounding once. Intent, the diff, the base commit, where the code lives, and
   how to run the tests. Every reviewer gets the identical grounding. The diversity comes
   from the angle you assign, not from telling them different things.

2. Split by angle, never by directory. Lanes given a slice of the same question return
   overlapping halves of one answer. Angles that carry their weight:

   - Line by line through every hunk, plus the enclosing function for each.
   - Removed behaviour: for every deleted line, name the invariant it held and find where
     the new code re-establishes it.
   - Callers and callees of every changed symbol, looking for a broken contract.
   - The pitfalls of this language and framework specifically.
   - The tests: what they assert, and which claimed behaviour nothing covers.
   - Data and migrations: what is already written in the old shape.

   Security is not on that list on purpose. Where the harness ships a security review, run
   it as its own pass, since it carries a threat model this list does not. Add the angle
   here only when nothing ships one, and give it the rule that keeps it useful: an untrusted
   input traced to the sink it reaches, not a category name.

3. Spawn read-only, one angle per agent, all in one message. Use the
   `adversarial-reviewer` agent, whose disposition and return contract are already written.
   Where the harness lets you choose models, put different families on different angles;
   model diversity is a second independent source of blind spots for free.

4. Let no reviewer fix anything. A reviewer that edits has taken the change over, and the
   parent can no longer tell the finding from the author's own work.

5. Dedup, then verify. Candidates pointing at the same line and mechanism collapse to one,
   keeping the most concrete failure scenario. Then put each survivor past one verifier that
   did not raise it, returning confirmed, plausible, or refuted with the line that proves
   it. Keep confirmed and plausible. Refuted needs a quote, not a feeling.

   Three states rather than a confidence score. A score invites a threshold, and a reviewer
   who knows the threshold writes findings that clear it, so the number ends up measuring
   the writing. Each of the three states names what would settle it instead.

6. Weight by independence. Two angles arriving at the same defect without seeing each other
   is the strongest signal this shape produces, and it belongs above the notes. A lone
   finding is not weak, but it needs its trace before it goes out.

7. Apply lead judgment. You have what the reviewers did not: the goal, the constraints,
   what was already tried, which parts are scaffolding. Sort into blocking, worth fixing,
   note, and dropped, per `SKILL.md`. Expect inflation, since a reviewer with nothing
   serious to say fills the space, and a batch that is all nits means the change is fine.

8. Sweep once for gaps. Give a fresh reviewer the verified list and ask only for what is not
   on it. No re-deriving, no re-confirming. An empty sweep is a good result.

9. Say what nobody covered. A gap in a parallel sweep is invisible, because every lane
   reports success at its own slice.

**Reply:** the angles and who ran them, consensus findings first, the ranked list, the
dismissals left visible so they can be overruled, whether the verify pass ran, and what no
angle covered.
