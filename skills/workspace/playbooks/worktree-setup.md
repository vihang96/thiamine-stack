### Worktree setup

**Create one worktree per repo the change touches, all on the same branch.** For starting
a change that spans services, and for adding a repo to a change already in progress.

1. Name the branch once. It is used verbatim in every repo, so pick it before touching any
   of them. The directory is the branch with slashes turned into dashes, so
   `feat/guide-success-rate` lands at `tree/feat-guide-success-rate`.

2. Decide which repos are in. Ask what the change actually edits rather than adding every
   repo that might be related. A service and its proto repo usually move together, since
   the proto has to land first. A worktree in a repo you never edit is noise in every
   future audit.

3. For each repo, fetch and branch from the remote default rather than from whatever the
   local checkout happens to be on:

   ```sh
   git -C "$repo" fetch origin
   git -C "$repo" worktree add -b "$branch" "$repo/tree/$dir" origin/HEAD
   ```

   If git refuses because the branch already exists, it names the worktree that holds it.
   Use that one. Do not create a second.

4. Copy in what the repo needs and does not track. A fresh worktree has no gitignored
   build output, no generated code, and no `.env`. A pre-push hook that runs a formatter
   over generated sources will fail in a worktree and pass in the main checkout, which
   reads as a problem with your change. Check the repo's own notes before assuming the
   worktree is ready.

5. Verify before starting work. Build or run the tests once in each new worktree, so a
   failure later belongs to your change rather than to the setup.

**Reply:** the branch name, each repo and its worktree path, what you copied in, and the
result of the verification in each. If a repo was considered and left out, say which and
why, because that is the decision most likely to be wrong.
