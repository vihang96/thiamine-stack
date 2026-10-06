### Triage review comments

**Classify every comment before changing any code.** For "address the review comments",
"address X's comments", "the reviewer left notes", a colleague's review of a design doc or a
plan, and any automated review that files findings on a pull request.

This is the inbound direction. Reviewing somebody else's change and writing the comments in
the first place belongs to the `interrogate` skill.

The goal is not to make comments disappear. It is to stop treating every comment as a
required code change, and to stop treating any of them as optional.

1. Gather every open thread across the repos the change touches. A comment on the contract
   repo often explains one on the service repo, and answering them separately produces two
   half answers.

2. Classify each thread before touching code:

   | Verdict | When | Then |
   | --- | --- | --- |
   | `fix` | a correctness, security, data loss, auth, migration, race, or shipped-behavior problem that you have seen happen or can trigger | fix it in the repo that owns it, reply with the commit SHA, resolve the thread |
   | `dismiss` | the current code already answers it, or it asks for something the change deliberately does not do | reply with the specific reason, resolve the thread |
   | `ask` | novel, high severity, or ambiguous, and guessing would be a coin flip; or the remedy would reverse a decision the owner already made | ask the reviewer or the user, and leave it open |

   Judge the concern and the proposed remedy separately. A reviewer's facts can all be true
   of today's code while the remedy undoes what the change is for, and that is how a design
   gets pulled back toward the implementation it replaces. Accept the concern, and derive
   the remedy from the change's own intent and the decisions its owner recorded.

   When in doubt, ask. Skipping a style nit is cheap. Skipping a real data or auth bug is
   not, and the two do not look different at a glance.

3. Verify before fixing, and before dismissing. A claim that a test does not cover
   something is cheap to check by running the test. A claim about behavior is cheap to
   check by exercising it, or by querying the runs, logs, or local database that would show
   it happening. Record each thread as observed or hypothetical. Dismissing on reasoning
   alone is how a real finding gets closed with a confident reply, and fixing on
   plausibility alone is how a hypothetical becomes a regression: a fallback added for a
   failure that never fired can quietly break the path that did work.

4. On a change or a design the user owns, show them the verdicts and the draft replies
   before pushing a fix or posting a reply. The pushed fix and the public reply are the
   hard parts to take back, and the owner is the one who knows which decisions were made
   on purpose.

   Reply to every thread you resolve, with the reason or the SHA. A thread resolved in
   silence reads as ignored, and the reviewer has to diff the branch to find out what
   happened. `unslop-prose` applies to the reply: a dismissal that opens by thanking the
   reviewer and then hedges reads as evasion, and a reviewer who has to reread it to find
   the verdict reopens the thread.

5. Hold the line on the change's intent. A reviewer asking for something outside the
   change's scope gets a reply naming the boundary and, where it is worth doing, a
   follow-up issue. Widening the diff to satisfy a comment is how a small pull request
   becomes unreviewable.

6. Push the fixes, then return to `playbooks/drive-ci-green.md`. Every fix restarts the
   checks, and this loop runs until the reviewer approves. Expect several rounds and do
   not treat the second one as failure.

**Reply:** a table of thread, verdict, observed or hypothetical, and what you did, grouped
by repo. Name every thread
you dismissed and why, since that is where a mistake hides. Say which threads you left open
and what you need to close them.
