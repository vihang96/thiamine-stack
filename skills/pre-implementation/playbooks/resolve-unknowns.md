### Resolve unknowns

**List what you do not know, then decide for each whether to observe it, ask it, or assume
it out loud.** For the start of any change, and whenever you notice yourself about to guess.

1. Write the unknowns down before resolving any of them. The ones that stay unlisted are
   the ones that surface as a bug. Include what you are assuming without noticing, which is
   the harder half. A useful prompt: what would have to be true for this change to be
   wrong?

2. Sort each one. This is the whole playbook, and getting it wrong costs either a day or a
   wrong feature:

   | Kind | Test | Do |
   | --- | --- | --- |
   | Observable | running, reading, or measuring would answer it | go and find out |
   | Decidable | only a person can settle it, because it is a preference, a priority, or a promise to someone | ask |
   | Tolerable | the answer would not change what you build | write the assumption down and move |

   Whether a query is slow, what a function returns on empty input, whether a field is ever
   null in production, how a library behaves under retry, whether an approach is fast
   enough. Every one of those is observable. Going to look takes minutes and produces a
   fact. Asking takes hours and produces an opinion.

3. Observe the observable ones. Read the code, run the thing, query the data, or build a
   throwaway sketch with `playbooks/prototype.md`. Cheap and specific beats thorough. You
   are answering one question, not auditing a system.

4. Batch the questions that are genuinely for a person, and ask them well. One message, each
   question with the options you see and what each would cost, and your recommendation.
   A question with no options attached asks them to do your thinking. A list of eight
   questions gets one answered.

   Ask about scope and priority. What is in and out, what happens to existing data and
   users, which of two behaviors is wanted, what the deadline is trading against. Do not
   ask which library to use or how to structure the code, unless the choice is genuinely
   theirs.

5. Say what you assumed. Every tolerable unknown becomes one line in the plan and in the
   pull request description. An assumption on the record gets corrected by a reviewer in
   seconds. The same assumption unstated becomes a bug that looks deliberate.

**Reply:** the unknowns as a table with what you did about each. State the questions you
are asking separately and plainly, and say what you will do while you wait, since the
answer usually unblocks one branch and not the whole change.
