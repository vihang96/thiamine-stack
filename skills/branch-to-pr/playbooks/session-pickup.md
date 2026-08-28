### Session pickup

**Reconstruct state from the workspace before touching anything.** For "pick up where I
left off", "what was I working on", and starting on a change someone else paused.

1. Read the record if there is one. `sh scripts/records.sh <workspace-root>`, in the
   `handoff` skill, lists them and flags the ones whose change already landed. It is the only
   source for intent, and intent is the part the repository cannot tell you. Where none
   exists, the `handoff` skill reconstructs one, which is slower and less complete, so do not
   skip looking first.

2. Audit. `sh scripts/audit.sh <workspace-root>`. Group the output by branch name, because
   one change spans repos and the branch is what ties them together. A branch appearing in
   three repos is one piece of work, not three.

3. Read the state rather than assuming it. Per worktree on the branch:

   ```sh
   git -C "$path" log --oneline origin/HEAD..HEAD
   git -C "$path" status --short
   ```

   A `wip:` commit at the tip means the last session paused deliberately. A dirty tree with
   no `wip:` commit means it stopped without one, so treat everything uncommitted as
   unreviewed and possibly mid-edit.

4. Check what moved underneath you. Fetch, and see whether the base advanced or a paired
   pull request landed while the work was paused:

   ```sh
   git -C "$path" fetch origin
   git -C "$path" log --oneline HEAD..origin/HEAD | head
   ```

   A landed contract change is the common case, and it means the service worktree is now
   building against something older than the remote.

5. Re-verify before continuing. Build or test each worktree once. The note says what was
   verified at pause time, and that was against a different base.

**Reply:** what the change is and which repos it spans, what is committed versus
uncommitted per repo, whether the base moved and what landed, the result of re-verifying,
and the next action. Say plainly when the record and the repository disagree, and trust the
repository.
