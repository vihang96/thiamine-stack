### Confirm decisions

**Put each decision in front of the person who owns the change, with what it rules out.**
For finishing a change, and before asking for review on anything where the approach was not
agreed up front.

Misalignment found here costs a conversation. Found in review it costs a rewrite, and found
in production it costs an incident.

1. List the decisions from the record rather than from memory. The build log in
   `handoff` should already hold them, along with the deviations. If there is no record, the
   decisions are still in the diff, and reconstructing them is the price of not having kept
   one.

2. State each one in the shape that invites disagreement:

   > We store the policy as a nullable column rather than a separate table, so there is one
   > policy per workspace and no join on the read path. Adding a second policy later means a
   > migration. Is that the tradeoff you want?

   The chosen option, the reason, what it costs, and a direct question. A decision presented
   without its cost reads as the only possibility and gets waved through.

3. Lead with the deviations. Anything that departed from the plan is the highest-risk item
   in the list, because the plan is what the user thinks was built. Say what changed, what
   forced it, and what you did instead.

4. Separate the reversible from the one-way. A naming choice can change next week. A schema
   shape, a wire format, or anything already written to by another service cannot. Say which
   is which, so the attention goes where it belongs.

5. Name the assumptions you carried. Every unresolved unknown that became an assumption
   during the build, stated plainly. An assumption on the record gets corrected in seconds.
   The same assumption unstated becomes a bug that looks deliberate.

6. Ask nothing you could have answered. A question about how the code behaves is yours to
   check. These are questions about what was wanted, which is theirs.

7. Treat no response as unconfirmed. Say which decisions were confirmed and which were not,
   and do not describe the change as agreed when part of it was met with silence.

**Reply:** the decisions as a short list, deviations first, each with its cost and whether it
is reversible. Then the assumptions. Then what you need a yes on before this is ready for
review.
