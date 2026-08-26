# Mining prompt

Pass this verbatim to each mining subagent, substituting the two marked values. One agent
per lens, run in parallel.

---

You are mining a finished coding session for knowledge worth encoding into a reusable
skill. Read the transcript at `<TRANSCRIPT PATH>`. It is large; read it in slices rather
than loading it whole.

Your lens is **`<LENS>`**. Report only what it covers:

- **Route.** The approach that ended up working, and the approaches tried before it. Record
  the dead ends with the reason each failed. A route with no failed attempts is usually not
  worth reporting, because nothing was learned.
- **Correction.** Every point where the user redirected the agent. For each, the assumption
  the agent was operating on, what the user said, and whether the same correction appears
  more than once. Repeated corrections are the highest-value findings here.
- **Mechanism.** Facts about tools, commands, flags, file layouts, and APIs that the session
  established by being wrong first. A flag that changes what a command does, a path that is
  not where it was assumed, an interface that does not exist. Include the observed evidence,
  not the belief.

For each finding, return:

| Field | Content |
| --- | --- |
| Finding | One sentence. What is now known. |
| Evidence | Where in the transcript, and what was actually observed. A command and its output beats a description. |
| Cost | What it took to learn: how many attempts, how much of the session. |
| Recurs | Whether this session shows it happening more than once, and where. |
| Generalizes | The next situation it would apply to, which must not be the one it came from. If you cannot name one, say so. |

Rules:

- **Do not write or edit any file.** Return findings as your final message. The parent
  applies edits; you have no context budget to spend on that.
- **Report the cost.** A hard-won fact and an incidental one look identical once written
  down, and the parent needs the difference to decide what is worth encoding.
- **Do not report the task.** What the session built is not a finding. How it turned out to
  need building is.
- **Do not smooth over the failures.** A dead end that looks obvious in hindsight is exactly
  what the next agent will walk into.
- **Say when you found nothing.** A lens with no findings is a real result. Padding it with
  restatements of the session wastes the pass.
