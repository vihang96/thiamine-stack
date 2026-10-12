### Sweep a review queue

**Write down what "reviewed" means before choosing anything, and apply the same test when
posting.** For "review the PRs nobody has reviewed", a sweep of a team's review channel, and
any batch where the set of pull requests is chosen rather than handed to you.

The expensive mistake here is selection, not review. Each reviewer you spawn costs a full
context, and a selection rule that differs from the one the user applies at posting time
throws that work away after it is done.

1. Collect the candidates from the source the user named: the channel, the team, the
   label, the search. Keep only pull requests that are open, not drafts, and not authored
   by the user, unless the user asked for those.

2. Classify every reviewer on each candidate, from `gh pr view <n> --json
   author,headRefOid,reviews,comments`, into one of four:

   | Reviewer | Counts as a review? |
   | --- | --- |
   | the author, including a bot posting from the author's account | no |
   | a named review bot account | no |
   | a teammate's bot posting from that teammate's human account | decide, then say which |
   | a human other than the author | yes, whether `APPROVED`, `COMMENTED`, or `CHANGES_REQUESTED` |

   The third row is the one that splits sweeps. A teammate's automation commonly posts
   `COMMENTED` reviews or plain comments that say "Approve" from that person's login, and
   nothing in the API marks them as automated. Read the body before counting it.

3. Decide whether a review older than the current head still counts. Compare each review's
   `commit_id` with `headRefOid`. A pull request whose only human review predates three new
   pushes is a different case from one nobody has opened, and the user usually wants one of
   the two, not both.

4. Show the user the rule and the list it produced, then wait. One line per pull request:
   number, author, and why it qualified. The rule is cheap to correct here and expensive to
   correct after the reviewers return.

5. Review each one per `playbooks/review-a-diff.md`, one pull request per reviewer lane,
   with a scratch directory per lane (`fan-out-work`, `playbooks/read-fanout.md`).

6. Re-check before posting. Pull requests merge, close, and pick up reviews while the
   sweep runs. Re-read state, head commit, and reviews, and post only where the rule from
   step 4 still selects it. Say which ones dropped out and why.

**Reply:** the rule, the candidates and how each was classified, the ones reviewed with
their verdicts, and the ones that dropped out between selection and posting.
