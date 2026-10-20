### Stacked PRs

**Each pull request targets its parent's branch, and the stack lands bottom first.** For a
change too large to review in one piece, and for a follow-up that depends on work still in
review.

Check for the tool before doing this by hand:

```sh
gh extension list | grep -q gh-stack && echo "use gh stack"
```

With `gh stack` the tool owns the base wiring and the restacking. Without it, the same
stack is a branch off a branch and `gh pr create --base <parent>`. The rules below hold
either way, because they are properties of how GitHub treats a chain of branches rather
than of any tool.

`gh stack` is per repository. A change spanning repos has one stack in each, and nothing
ties them together but the branch names and your description.

## With gh stack

```sh
gh stack init                 # start a stack on the current branch, targeting trunk
gh stack add feat/next        # add a branch on top of the current one
gh stack submit --open        # push and create or update the PRs, ready for review
gh stack view --short         # the chain, bottom first
gh stack rebase               # restack after the bottom moves
```

**Pass `--open` to submit.** The flag exists to mark pull requests ready for review, so
without it they stay drafts, and a draft requests review from nobody and sits. Confirm with
`gh pr view` rather than assuming the flag worked.

**Never run `gh stack merge`.** It merges the whole stack, and `--yes --squash` does it
without prompting. Merging is the human's after approval, and this is the single command
that would take that decision away.

## By hand

```sh
gh pr create --base feat/parent --head feat/child --title "..." --body "..."
git rebase --onto feat/parent <old-parent-sha> feat/child
git push --force-with-lease
```

Use `--force-with-lease`, never `--force`. The lease is what stops you overwriting a commit
someone pushed while you were rebasing.

### When the parent was squash-merged

A squash lands the parent's content on the default branch under a new commit, so the
child's history and the default branch disagree about lines they agree on. Merging the
default branch into the child then reports conflicts in files the child never changed.
Those conflicts are not real, and resolving them by hand is how a fix gets dropped.

Sync by merging, which needs no force-push. A harness in auto mode refuses to rewrite a
pushed branch, and a rebase invalidates every approval above it (rule 3):

```sh
git fetch origin
git merge <parent-final-tip>                                  # clean: the child already sat on it
git diff --quiet <parent-final-tip> origin/main && echo same  # main's tree is the parent's tip
git merge -s ours origin/main                                 # record the squash as included
git push
```

Run the `-s ours` step only when the `diff --quiet` printed `same`. If it did not, other
work landed on the default branch too, and that needs an ordinary merge.

This recurs at every level. Each parent that lands makes its own child need the same sync,
so a child reported as mergeable before its parent landed can still conflict afterwards.
Run the sync after each parent merges, before saying the next one is ready.

A pull request opened against the default branch by mistake shows every commit from every
ancestor. An enormous diff on the third pull request in a chain is that mistake, not a
large change.

## Rules that hold either way

1. **Keep each piece landable on its own.** The bottom merges first and lives with whatever
   is above it unfinished, so it cannot depend on a later piece to be correct. If the bottom
   only makes sense once the top exists, the change is split at the wrong seam.

2. **Say what the stack is, in every description.** Number them and link the parent. A
   reviewer looking at the third pull request cannot tell what is already reviewed below it.

3. **Treat a rebase as invalidating review above it.** Rewriting the parent rewrites every
   SHA above, so an approval now points at commits that no longer exist while still reading
   as an approval. Nothing on GitHub marks this. Say which pull requests were rebased and
   ask for another look.

4. **Never enable auto-merge on a stack.** Every pull request except the bottom targets an
   unprotected parent branch and reads as mergeable immediately, so auto-merge collapses the
   stack into itself in the wrong order.

5. **Land bottom first, one at a time.** GitHub retargets a child's base when its parent
   merges. Confirm the retarget landed before touching the child rather than assuming it.
   In a repo that squash-merges, sync the child as in "When the parent was squash-merged"
   before calling it ready.

**Reply:** the stack bottom first, from `gh stack view --short` or
`sh scripts/pr-status.sh --stack <top-branch>`, whichever the repo supports. Name the
lowest pull request that is not ready, because that one blocks everything above it. Say
whether the pull requests are drafts.
