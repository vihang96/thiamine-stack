### Worktree cleanup

**Remove worktrees whose work has landed, and never one holding work that exists nowhere
else.** For "clean up the worktrees", after a change lands, and when the workspace has
accumulated more than you can account for.

1. Audit first. `sh scripts/audit.sh <workspace-root>` reports every worktree with the
   flags a decision needs. Do not walk the directories by hand, and do not decide from
   memory of what landed.

2. Sort by flag. Each one means something different:

   | Flag | What it means | Default |
   | --- | --- | --- |
   | `clean` and `gone` | merged, and the remote branch was tidied up | remove |
   | `clean` with an upstream | pushed and still open | keep, it is in review |
   | `no-upstream` | never pushed, so the branch exists only here | ask |
   | `unpushed:N` | N commits the remote does not have | ask, and show the log |
   | `dirty` | uncommitted changes | ask, and show the status |
   | `missing-dir` | the directory is gone, the registration is not | prune |

3. Confirm the landed ones are actually landed. `gone` means the upstream branch was
   deleted, which is usually a merged and tidied pull request, but a force-deleted branch
   looks identical. Check that the commits are reachable from the default branch:

   ```sh
   git -C "$repo" fetch origin
   git -C "$repo" branch --merged origin/HEAD | grep -F "$branch"
   ```

4. Show the user everything flagged `dirty`, `unpushed`, or `no-upstream` before removing
   any of it, with the file list or the commit log. Those flags mean the work exists in
   exactly one place, and a worktree removal takes it with it. Never batch these in with
   the safe removals.

5. Remove, then prune:

   ```sh
   git -C "$repo" worktree remove "$path"
   git -C "$repo" worktree prune
   ```

   `worktree remove` refuses on a dirty tree, which is a safety net rather than an
   obstacle. Reach for `--force` only after step 4, and say that you did.

6. Delete the local branch only when its worktree is gone and it is merged. A branch with
   no worktree costs nothing, so leaving it is fine.

**Reply:** a table of what was removed and what was kept with the reason, and the count
before and after. Name anything you forced.
