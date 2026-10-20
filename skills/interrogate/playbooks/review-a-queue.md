### Review a queue

**Settle which pull requests are waiting before reviewing any of them.** For "sweep this
channel and review the PRs that have no review yet", "what is waiting on me", and any batch
of other people's pull requests gathered from a channel, a label, or a search.

The expensive part of a sweep is not the reviews. It is the definition of "waiting". Two
sweeps over the same channel with different definitions return different queues, and
neither says so. One quietly swaps the request for a different task. The other reviews ten
pull requests and can post on one.

1. Read the whole source. A channel read returns one page, so follow the cursor back to the
   window the user named, or to the oldest pull request still open. Say how far back you
   read.

2. Decide "waiting" from the pull request, not from the message or from a rolled-up status.
   A pull request is waiting when no human has left an `APPROVED` or `CHANGES_REQUESTED`
   review on its current head commit. These do not count as a review:

   - A bot account's review.
   - A `COMMENTED` review, or a comment that says "approve", even under a human's account.
     A teammate's agent often posts that way, and nobody has approved anything.
   - A verdict on an older head. The author pushed since, and nobody has looked.

   ```sh
   gh pr view <n> --json headRefOid,reviews,isDraft \
     --jq '{head: .headRefOid, draft: .isDraft, reviews: [.reviews[] | {who: .author.login, state, commit: .commit.oid}]}'
   ```

   A rolled-up status lies in both directions. `reviewDecision` stays `CHANGES_REQUESTED`
   after the author fixes the comment, until that reviewer looks again, and it reads empty
   on a pull request that has three bot reviews.

3. State the queue and the rule to the user before fanning out. One line per pull request,
   with why it qualifies. If the user's words admit two readings, this is where they pick
   one. It costs one message, and reviewing the wrong set costs every reviewer's run.

4. Review each one through the rest of this skill. A queue is many artifacts, not one
   artifact with many angles, so `fan-out-reviewers.md` applies per pull request when one
   earns it, not across the queue.

5. Re-check the rule for each pull request before posting. The queue moves while you review,
   and a pull request that picked up a human review in the meantime does not need a second
   one. Show the drafts first, since they go out under the user's name, then deliver through
   `deliver-the-review.md`.

**Reply:** how far back you read, the rule you applied, the queue with one reason each, and
what you excluded and why. After the reviews, say which ones you posted and which you held.
