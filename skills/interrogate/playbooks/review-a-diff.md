### Review a diff

**Intent, then reviewability, then defects.** For a pull request, a branch, a range of
commits, or uncommitted work somebody hands you.

Check the floor in `SKILL.md` first. A small, reversible, one-concern diff gets steps 1 and
3 and a two-sentence answer, and none of the rest.

1. Fix the scope, and say what it is. `git diff origin/HEAD...HEAD` for a branch,
   `gh pr diff <n>` for a pull request, `git diff HEAD` when the work is uncommitted. If
   both a range diff and a working tree exist, review both and say so, because the half you
   skip is where the unfinished part lives.

2. Take a focus if you were given one. "Check the error handling in the new API", "look at
   the payment flow". A focus raises the depth on that area and lowers it everywhere else;
   it does not narrow the scope, because a blocking defect outside the focus still blocks.
   Say in the review which parts got the deep pass and which got the light one, or the
   author reads a focused review as a full one.

3. Read the discussion already on the pull request, on every pass: the issue comments, the
   inline threads, and the review bodies. They come from three endpoints, and
   `gh pr view` shows only part of them:

   ```sh
   gh api "repos/$repo/issues/$n/comments" --paginate
   gh api "repos/$repo/pulls/$n/comments" --paginate
   gh api "repos/$repo/pulls/$n/reviews" --paginate
   ```

   A trade-off the author and a reviewer already settled there is not a new blocker. A
   finding that re-argues it reads as not having read the thread, and once posted under
   someone's name it has to be walked back in public.

   State the intent in one paragraph, and say where you got it: the description, the commit
   bodies, the linked issue, the thread, the conversation. If none of them say, ask. A diff reviewed
   with no intent produces design opinions, which is the least useful review shape there
   is.

4. Judge reviewability before content. Is it one concern, or a refactor and a feature
   travelling together? Does the description describe this change? Are generated files
   mixed in with hand-written ones? When the answer is no, that is the review. Say what to
   split and stop, because findings from inside an unreviewable diff will be re-litigated
   after the split anyway. Size alone is not a no: a large, single-concern change gets the
   full review, split across reviewers per `playbooks/fan-out-reviewers.md`, and the reply
   says which files were read.

5. Run the harness's diff review if it has one. In Claude Code that is the `code-review`
   skill, which already fans out over the bug-hunting angles and verifies each candidate.
   Elsewhere, run the angles yourself per `playbooks/fan-out-reviewers.md`. Either way its
   output is a candidate list, not a review.

6. Add the four things it does not do.

   - **Intent.** Does the change achieve step 3, and does it do the thing it claims?
   - **Scope.** What is in the diff that the intent does not need.
   - **Claims.** Run `playbooks/audit-the-claims.md` over the description and any report.
   - **Author-shaped defects.** For agent-authored work, the list in `SKILL.md` under
     "Reviewing work an agent produced".

7. Verify before reporting, and before dismissing. Read the enclosing function, grep the
   callers, run the touched test. Dismissal needs the same evidence as a finding, since a
   confidently wrong dismissal is how a real defect gets closed.

8. Rank, cut, and deliver per `playbooks/deliver-the-review.md`.

9. Remove any checkout you made for the review, and the local branch you fetched into it.
   A `git worktree add` from a session's scratchpad is registered in the author's repo and
   outlives the session, and a later cleanup reads it as somebody's work in review.

   ```sh
   git -C "$repo" worktree remove --force "$checkout" && git -C "$repo" branch -D "pr-$n"
   ```

**Reply:** the scope you reviewed, the intent and where it came from, the verdict with
counts by severity, the findings in rank order, what you dismissed and why, and what you
did not reach.
