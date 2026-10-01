### Deliver the review

**A finding the author cannot act on is not feedback.** For posting a review, replying with
one, or handing findings to the agent that wrote the code.

1. Lead with the verdict and the counts, once. Blocking, worth fixing, notes, and the number
   you dropped. A reader who stops after the first three lines should already know whether
   they have work to do.

2. Give every finding three parts, in this order.

   - **What breaks.** The input or state, and the wrong result.
   - **Where.** For a diff, `file:line`. For a GitHub comment, a permalink with the full
     commit SHA, since a line number moves on the next push. For a plan or a design doc, the
     section or quoted text that the comment anchors to. Argue at the level the doc is
     written, and keep the code you traced as your own evidence. A code link in a design
     comment moves the discussion to an implementation the doc has not chosen yet.
   - **What would satisfy it.** The condition, not necessarily the patch. Include a concrete
     fix only when it is small and you are sure, because a wrong suggested fix costs the
     author more than no suggestion.

3. Label blocking and non-blocking in the text of each finding. Tone is not a signal anybody
   can act on, and an author guessing which comments block will guess wrong in both
   directions.

4. Ask instead of asserting when you are not sure. "What happens when `spec` is empty here?"
   costs a reply. A wrong assertion costs the author a defence and you a retraction, and it
   spends the credibility the next finding needs.

5. Group the notes at the end, in one block. One thread per nit turns a review into an
   inbox, and the author starts resolving threads instead of reading them.

6. Say what you did not check, in a sentence. This is the part that makes the rest
   trustworthy, and it is the first thing dropped when a review is written to look complete.

7. Address the code, not the author. Agents do not care, humans do, and the same review goes
   to both, so there is no version of this worth writing twice.

8. Write it to the technical-writing standard, then cut the tells. A review comment is prose
   a person reads, on a pull request, a plan, or a doc alike. `technical-writing` sets how
   its sentences read: name who does what, give one thought per sentence, put the condition
   before the request, and call each thing by its real name every time. `unslop-prose` then
   cuts the tells. Three of its patterns do specific damage here, and they are worth
   checking even when you skip the rest.

   - **Sycophancy.** "Great work on this!" ahead of a blocking finding reads as either
     insincere or as permission to merge. Open with the verdict.
   - **Hedging.** "It might be worth considering whether this could potentially" turns a
     traced defect into an optional suggestion, and the author will treat it as one. If you
     traced it, say it happens. If you did not, say you are asking rather than softening the
     assertion.
   - **Padding.** A summary of what the change does, restated back to the person who wrote
     it, buys nothing and pushes the findings below the fold.

   Skip its "adding soul" section. A review wants to be dry and skimmable, not voiced.

   On a plan or a design doc, post each finding as its own comment, anchored to the section
   it concerns.

   Keep a posted comment to one screen. Give each finding one line and one link. Leave out
   what checked out, and give what you did not check a single line. The full reasoning can
   stay in your reply to the user. A long comment gets skimmed, and the blocking finding is
   what gets missed.

9. Do not fix it while reviewing. A reviewer who rewrites the change has taken it over and
   nobody is left to review it. If the author asks you to apply the findings, do it as a
   separate commit, say which findings it covers, and leave the ones you did not act on
   stated rather than silently dropped.

10. Mechanics, when it is a pull request. `gh pr review --comment` or `--request-changes`
    with a body, and `gh pr comment` for a follow-up. Where the harness's diff review can
    post inline findings itself, let it, and add the verdict and the unchecked areas as a
    top-level comment. `branch-to-pr` owns everything else about the pull request,
    and its `triage-review-comments` playbook is what the author runs when your review
    lands.

11. Confirm the recipient before handing findings to another session. A guessed recipient
    acts on work it does not own. A session that is not running cannot receive messages,
    so write the findings to a file and give the user the command to resume that session.

**Reply:** the verdict line, blocking findings, non-blocking findings, notes as one group,
the dropped count, and what you did not check.
