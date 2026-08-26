### Explain the change

**Say what it does, how it works, and why it is shaped that way, plainly.** For "explain
what you built", "walk me through this", and before asking anyone to review a change they
did not write.

The goal is that they understand it, not that you demonstrate you do.

1. Decide the few things they should walk away with, from why they are asking. Someone about
   to review it needs the decisions and the risk. Someone about to extend it needs the shape
   and the boundaries. Someone debugging it needs the path a request takes. Read that from
   the conversation rather than asking.

2. Lead with the smallest complete answer. Two sentences on what it does and the one thing
   that makes it work. Then stop, and add layers when they ask. A wall of text is not
   thoroughness, it is a refusal to prioritise.

3. Name the mechanism, not a metaphor. "The scheduler reads the policy at enqueue time
   because tenant context does not exist yet when the job runs" teaches. "It handles
   retention cleanly" does not. Listing the functions you added is a changelog, not an
   explanation.

4. Build a picture up rather than showing a finished one. For anything with three or more
   moving parts, draw it two or three times, each time adding one part, so they watch it
   assemble. One diagram with everything on it is reference material and lands as a wall.

5. Say what you are unsure about, and where the change is most likely wrong. This is the
   most useful part of the explanation and the part that gets left out, because it reads as
   weakness. It is the opposite: it tells the reviewer where to look.

6. Keep it a conversation. Offer to go deeper and follow their lead. Do not label parts as
   important, do not announce what is coming, and do not ask them to repeat anything back.

**Reply:** the explanation itself, never a report about having explained. Lead with the
point, then what it does, how it works, and why, then what you are unsure about.
