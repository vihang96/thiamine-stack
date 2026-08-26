### Record the decision

**Write down the choice, so the next person inherits an answer instead of a fork.** For a
concern with no existing answer, a deliberate departure from one, and the architecture of a
new service.

A record exists to stop the question being asked again and to stop the answer drifting. If
it does neither, do not write it.

1. Write it only for a decision someone would otherwise re-litigate. A store, a
   cross-cutting pattern, a boundary, a departure from a sibling service. Not a library
   nobody will question and not a choice with one obvious answer.

2. Put it where the decision applies. A decision about one service goes in that repo. A
   decision every service inherits goes wherever the shared standards live, and a record
   that applies everywhere but sits in one repo is a record nobody else will find.

3. Keep it to five parts, and keep it short. A page is plenty:

   - **Context.** What forced a decision. The constraint, not the history.
   - **Decision.** What was chosen, in one sentence, in the present tense.
   - **Alternatives.** What else was considered and the specific reason each lost. This is
     the part that stops the question returning, so a list with no reasons is worse than no
     list.
   - **Consequences.** What this makes easy, what it makes hard, and what someone has to
     live with. Include the cost, or the record reads as advocacy.
   - **Status.** Accepted, and the date. Superseded later, pointing at what replaced it.

4. Say what it does not cover. A record that reads as though it settled more than it did is
   how the next person finds it inadequate and writes a second one beside it.

5. Never edit an accepted record to change its decision. Write a new one and mark the old
   one superseded, pointing forward. The history is the value: a record that has always
   agreed with the current code teaches nothing about why.

6. Apply `technical-writing` and `unslop-prose`. This is explanation in the Diátaxis sense,
   read once by someone deciding whether to follow it, so the first paragraph has to carry
   the decision.

**Reply:** the path it was written to, the decision in one sentence, the alternatives and
why each lost, and what it deliberately leaves open. Say who or what now has to follow it.
