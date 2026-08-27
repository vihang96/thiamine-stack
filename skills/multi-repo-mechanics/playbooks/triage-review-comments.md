### Triage review comments

**Classify every comment before changing any code.** For "address the review comments",
"the reviewer left notes", and any automated review that files findings on a pull request.

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
   | `fix` | a plausible correctness, security, data loss, auth, migration, race, or shipped-behavior problem | fix it in the repo that owns it, reply with the commit SHA, resolve the thread |
   | `dismiss` | the current code already answers it, or it asks for something the change deliberately does not do | reply with the specific reason, resolve the thread |
   | `ask` | novel, high severity, or ambiguous, and guessing would be a coin flip | ask the reviewer or the user, and leave it open |

   When in doubt, ask. Skipping a style nit is cheap. Skipping a real data or auth bug is
   not, and the two do not look different at a glance.

3. Verify before dismissing. A claim that a test does not cover something is cheap to
   check by running the test. A claim about behavior is cheap to check by exercising it.
   Dismissing on reasoning alone is how a real finding gets closed with a confident reply.

4. Reply to every thread you resolve, with the reason or the SHA. A thread resolved in
   silence reads as ignored, and the reviewer has to diff the branch to find out what
   happened.

5. Hold the line on the change's intent. A reviewer asking for something outside the
   change's scope gets a reply naming the boundary and, where it is worth doing, a
   follow-up issue. Widening the diff to satisfy a comment is how a small pull request
   becomes unreviewable.

6. Push the fixes, then return to `playbooks/drive-ci-green.md`. Every fix restarts the
   checks, and this loop runs until the reviewer approves. Expect several rounds and do
   not treat the second one as failure.

**Reply:** a table of thread, verdict, and what you did, grouped by repo. Name every thread
you dismissed and why, since that is where a mistake hides. Say which threads you left open
and what you need to close them.
