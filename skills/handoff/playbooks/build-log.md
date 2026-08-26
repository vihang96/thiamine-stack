### Build log

**Append the decision while you still remember why.** For a choice made mid-build, a
departure from the plan, and anything tried that did not work.

One line, at the moment it happens. The cost has to stay near zero or it stops happening,
and a log kept badly is worse than none because it looks complete.

1. Append when the next session would otherwise decide differently. Four things qualify:

   - **A decision with a rejected alternative.** What you chose and what you did not, in one
     clause each. Without the rejection it reads as the only option and gets undone.
   - **A deviation from the plan.** What the plan said, what you did instead, and the thing
     you found that forced it. Deviations are the highest-value entries, because the plan is
     the document the next session trusts and it is now wrong.
   - **Something tried that failed.** So it is not tried again. Include how it failed.
   - **A constraint you discovered.** An ordering that matters, a field that is never null in
     practice, a job that runs before the context it needs exists.

2. Point at evidence rather than describing it. A commit SHA, a `file:line`, a pull request
   number, or the path to a screenshot. An entry that argues for itself in a paragraph is
   unverifiable, and a pointer is checkable in seconds.

   Where an entry has an outcome, record it: tests green, reverted, still open, inconclusive.
   A decision with no recorded result reads as having worked.

3. Do not append narration. Not files touched, not tests run, not progress. Those are in the
   diff and the transcript. A log padded with them buries the four things above.

4. Keep the header true as you go. When the next action changes, rewrite the `Next` line
   rather than appending a new one. The header is state and the log is history, and mixing
   them means reading the whole file to find out where things stand.

5. Write it for someone with no context. Name the file and the symbol. "Moved the check
   earlier" means nothing next week. "Moved the tenant check into RetentionJob.enqueue,
   because run happens before tenant context exists" survives.

6. Update the record before context compacts, not after. Compaction is the case this exists
   for, and anything still only in the conversation is gone.

**Reply:** nothing, usually. Appending is a side effect of working, not a task to report on.
When the entry is a deviation from an agreed plan, say so in the turn where you make it, so
the user can object while it is cheap.
