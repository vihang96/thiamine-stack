### Shippable

**Decide whether a human can approve and merge this without doing your work again.** For
"is this ready", "make sure it is shippable", and before asking anyone to review.

A human merges after approving. This playbook produces the evidence that approval can rest
on, and stops there.

1. Check the state is actually green, in every repo:

   ```sh
   sh scripts/pr-status.sh <branch> <workspace-root>
   ```

   Green in one repo and red in another is not green. Neither is a stale run from before
   the last push, so confirm the checks describe the current head rather than an earlier
   commit.

2. Confirm nothing is outstanding. No unresolved review threads, no thread resolved
   without a reply, and no comment you deferred without saying so.

3. Read the diff as a reviewer would, not as its author. Ask what a reader who has not
   seen the last four hours would need. Delete the debugging leftovers, the commented-out
   attempt, and the comment that narrates what the code plainly does. The `rules/RULES.md`
   scaffolding and comment rules apply here, and this is the last point where applying
   them is cheap.

4. Check the description still describes the diff. Several rounds of review move code, and
   a `## Verification` section listing what you ran three pushes ago is worse than none,
   because it looks like evidence.

5. Verify the claim yourself, on the real surface. Run the tests, exercise the behavior the
   change is for, and say what you observed. Passing checks say the code did not break what
   was already tested. They do not say the change works, and no reviewer can tell the
   difference from the outside.

6. Say what you are not sure about. A reviewer who knows where you are uncertain reviews
   that part properly. One who is told everything is fine reviews nothing properly.

7. Check the other half. This playbook says the code is ready. It does not say the person
   whose name is on it can explain it, which is the `post-implementation` skill. Green checks
   on a change nobody can defend fails in review at best.

8. Stop. Do not merge, do not enable auto-merge, and do not approve it yourself. Hand over
   with the evidence and let the human decide.

**Reply:** the status line per repo, the verification you ran and what it reported, what
you cleaned up in the final pass, anything still uncertain, and a plain statement that it
is ready for approval. Never report ready for a repo you did not check.
