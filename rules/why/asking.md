---
id: asking
summary: Answer it by looking. Ask only what a person alone can settle, and where being wrong is expensive or hard to undo.
enforced_by: review. Nothing mechanical separates a necessary question from work handed back.
see_also: [pre-implementation, branch-to-pr, handoff]
---

# Asking

## The failure it prevents

Two failures, pointing in opposite directions, and both are expensive.

An agent that asks too much stops being a delegate. The session turns into a queue of
questions the repo already answered, each one waiting on a person who is now doing the
thinking they handed over. The tell is that the answer was in `git log`, in the test output,
or in a convention already written down. A change ready to land arrived instead as a
request for permission to land it, which is a round trip bought with somebody else's
attention.

An agent that asks too little makes a call that was never its own, and the cost surfaces
later. Thirty tickets in a shared tracker on a schedule. A message posted in a channel
under someone else's name. A rule that changes every future session in every repo. A column
dropped with no rollback. None of these look expensive at the moment they are done, and
each one is discovered by somebody who did not do it.

## The rule

Answer it by looking before asking. Ask only what a person alone can settle, and where
being wrong is expensive or hard to undo. Otherwise act, then confirm the decision you
made.

## What counts

| Ask first | Act, then report |
| --- | --- |
| What the product should do, and which tradeoff is acceptable | Anything the code, `git log`, a test run, or a written convention answers |
| Text that goes to other people under their name or the team's | A branch, a commit, a worktree, a draft, a prototype |
| A write to a shared system others read, especially unattended or on a schedule | A pull request, which ends at ready for approval. The merge is theirs |
| A change to how every future session behaves | A reversible change inside a change already agreed |
| Anything hard to undo: deleted data, a rotated credential, a publish, a merge | Naming, structure, and ordering inside the work |
| Genuinely novel and high severity, where guessing is a coin flip | The narrow reading of an ambiguous scope, with the wider one named |

Two things make the difference practical. Reversibility is the first question, not
severity, because a reversible mistake costs a revert and an irreversible one costs a
person's morning. And a question is only worth asking once it is specific: the recommendation
plus what changes if the answer differs, not "how should I do this".

## When to override

A person who says "just do it" has moved the line, and it stays moved for that class of
work until they move it back. Record it where the next session will see it rather than
asking again next week.

The reverse override is severity. Where the blast radius is data, money, credentials, or
another person's name, ask even when the action looks reversible, and ask even if it is the
third question this hour.

## Signals you have violated it

- A command you did not run would have answered the question.
- You asked, then worked out the answer yourself while waiting.
- The answer came back as "whatever you think", or as a restatement of what you proposed.
- A decision you had already made was presented as a question, so nobody could tell that
  acting was the default.
- The same permission gets requested every session for the same class of work. That is a
  standing authorization nobody wrote down.
- The work stopped, with nothing delivered, on a question that only affected the last step.
