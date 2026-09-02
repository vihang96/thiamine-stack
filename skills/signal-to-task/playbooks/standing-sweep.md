### Standing sweep

**Pull only what is new, give every item a verdict, then advance the watermark.** For "triage the
error queue", "check the feedback channel", a recurring sweep on a schedule, and the first
pass over a source nobody has read.

A sweep that re-reads the whole queue every time costs the same on the fiftieth run as the
first, so it stops being run. The watermark is what makes it cheap, and the ledger is what
makes the watermark safe.

1. Read the configured sources. `<workspace>/.thiamine/triage/sources.tsv`, one row per
   source, because which channels and projects count is a per-workspace fact and guessing it
   is how a sweep reports on a channel nobody watches.

   ```
   name              kind           locator                         interval
   sentry-api        error-tracker  org/api, env:production         daily
   feedback-eng      chat           #product-feedback               daily
   linear-inbox      tracker        team ENG, state Triage          weekly
   run-exceptions    run-queue      workspace prod, unassigned      daily
   api-logs          logs           service api, level>=error       weekly
   ```

   If the file does not exist, ask which sources count and write it. One question, once,
   beats a sweep whose scope nobody agreed to.

2. Pull what each kind is good for. The trap column is the one that matters, because each
   source lies in its own way.

   | Kind | Pull | Fingerprint from | The trap |
   | --- | --- | --- | --- |
   | Error tracker | new and regressed groups, count and user count in the window, first and last seen, release | culprit plus the top frame you own | its grouping is not yours. One group is often three bugs, and one bug three groups |
   | Chat feedback | messages in the named channels since the watermark, with the thread | the behaviour complained about, not the words | one person restating a thing five times is one signal, and silence is not absence |
   | Tracker | items in the triage state, plus anything untouched past its age | the existing item is the fingerprint | a ticket already filed is a claim, not evidence. Check it before re-filing its cause |
   | Logs | error and warn aggregated by template, with counts and slope | the message with ids, uuids, and numbers stripped | volume follows traffic. Compare rates, never counts, across windows |
   | Run queue | failed and stuck runs, and exceptions nobody has answered | the failing step plus the error class | a customer-visible failure hides here behind an ordinary-looking retry |
   | CI | jobs failing on the default branch, and flakes by rate | the test id plus the assertion | a flake is a signal about the test, and a real one about the code. Do not merge them |

3. Cap the read. Take the top N by cost per kind, then say what N was and what you left.
   Reading everything and running out of context halfway leaves no record of either.
   Delegate a large pull to a subagent and keep the reduced list in the main thread
   (`fan-out-work`).

4. Give every item a verdict before touching the watermark, per `playbooks/route-it.md` and
   `playbooks/file-the-task.md`. Then advance the watermark to the newest item you gave a
   verdict to, not to now. Both halves matter: advancing early loses everything unread,
   and never advancing makes the next sweep a re-read.

5. Report the delta, not the queue. What is new, what changed verdict, what tripped a
   `watch`, and what you did not reach. When nothing is new, say that in one line; a sweep
   whose quiet runs are as long as its loud ones is one nobody reads.

6. Schedule it to match the source. An error tracker on a deploy day is worth a daily pass;
   a feedback channel weekly; a tracker's triage state whenever the sprint boundary is. In
   Claude Code, run it on a recurring interval with the built-in `loop` (a slash command it
   ships) or a cron entry; elsewhere, a person running it each morning works too.
   State the interval in `sources.tsv` so it is a decision rather than a habit.

7. Say when to stop looping. A sweep with an empty delta three times in a row means the
   interval is too short or the source is quiet. Widen the interval or drop the source from
   the file, and say which.

Acknowledging a complaint in the channel it came from is worth doing and belongs to the
person who owns that channel, not to the sweep. If you do reply, `unslop-prose` owns the
words: what you found, what happens next, no thanks-for-the-report padding.

**Reply:** the sources swept and the window, the delta by verdict, anything that tripped a
watch, the new watermark, and what you capped or did not reach.
