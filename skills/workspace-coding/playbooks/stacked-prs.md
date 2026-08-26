### Stacked PRs

**Each pull request targets its parent's branch, and the stack lands bottom first.** For a
change too large to review in one piece, and for a follow-up that depends on work still in
review.

There is no stacking tool here. A stack is plain git plus `gh`: a branch off a branch, and
a pull request whose base is the parent branch rather than the default branch.

1. Branch each piece off the one below it, and open each pull request against that parent:

   ```sh
   gh pr create --base feat/parent --head feat/child --title "..." --body "..."
   ```

   A pull request opened against the default branch by mistake shows every commit from
   every ancestor, which is the symptom to watch for. Its diff will be enormous and the
   reviewer will say so.

2. Keep each piece landable on its own. The bottom of a stack merges first and lives with
   whatever is above it unfinished, so it cannot depend on a later piece to be correct. If
   the bottom only makes sense once the top exists, it is one change split at the wrong
   seam.

3. Say what the stack is, in every description. Number them and link the parent. A reviewer
   looking at the third pull request cannot tell what is already reviewed below it.

4. Rebase the whole stack when the bottom changes, from the bottom up:

   ```sh
   git rebase --onto feat/parent <old-parent-sha> feat/child
   git push --force-with-lease
   ```

   Use `--force-with-lease`, never `--force`. The lease is what stops you overwriting a
   commit someone pushed while you were rebasing.

5. Treat a rebase as invalidating review above it. Rewriting the parent rewrites every SHA
   above, so an approval now points at commits that no longer exist while still reading as
   an approval. Say plainly which pull requests were rebased and ask for another look, and
   never treat an approval from before a rebase as current.

6. Never enable auto-merge on a stack. Every pull request except the bottom targets an
   unprotected parent branch and will read as mergeable immediately, so auto-merge collapses
   the stack into itself in the wrong order. Merging is the human's here, which makes this
   easier to hold to than it sounds.

7. Land bottom first, one at a time, and let each merge settle before the next. GitHub
   retargets a child's base when its parent merges, so confirm the retarget landed before
   touching the child rather than assuming it.

**Reply:** the stack bottom first, with each pull request's number, base, state, and
review, from `sh scripts/pr-status.sh --stack <top-branch>`. Name the lowest pull request
that is not ready, because that one blocks everything above it.
