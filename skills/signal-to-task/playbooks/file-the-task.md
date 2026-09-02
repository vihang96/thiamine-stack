### File the task

**Write it for someone who has never seen this system, then file it keyed on the
fingerprint.** For a `file` verdict, a `merge` note, and the ledger row every other verdict
still owes.

The reader is a stranger. They are picking this up in three weeks, on a different team,
without the queue in front of them and without the reading you just did. Everything they
need is in the task or the task is a re-run of your afternoon.

1. Search before you create. Query the tracker for the fingerprint, then for the symptom in
   words somebody else would have chosen. Filing is a write to a shared tracker, so the
   fingerprint is what makes a scheduled sweep safe to run twice
   (`rules/why/idempotence.md`). Found an open item: `merge`, add the count and window, file
   nothing.

2. Put the fingerprint in the task itself, in the title or a fenced line in the body, so the
   next sweep matches on the item rather than on your prose. This is the whole dedupe
   mechanism and it is one line.

3. Write the body as these six, dropping any that would be empty. Terse is the standard:
   one screen, and nothing a reader has to decode.

   - **What happens.** One sentence, in behaviour, not in stack frames. `Exports over 50MB
     fail with a timeout after about 30 seconds.`
   - **Evidence.** Counts and the window, the artifact paths, the trace or run ids, the
     query you ran. Enough that someone can see it themselves.
   - **Cause, or how far you got.** File, symbol, line where you have it. Where you do not,
     say what you ruled out. An honest gap beats a confident guess by a distance.
   - **Reproduce.** The command or the steps, or the plain sentence that it did not
     reproduce and what you tried. Never leave the reader to discover that.
   - **Blast.** Who is affected and how many, and whether they can see it.
   - **Done when.** The observable condition that closes it. `p95 export under 5s at 50MB`,
     or `this fingerprint stops appearing`. A task with no closing condition gets closed by
     giving up.

4. Cut the language to a stranger's vocabulary. This is a separate pass and it is where most
   tickets fail. `unslop-prose` and `technical-writing` own the words, and applying them
   means running them, not having read them. Three things specifically:

   - Expand the shorthand once. Internal names, service nicknames, and acronyms get their
     full form the first time or a link.
   - Short sentences, active voice, one idea each. The reader is skimming a backlog.
   - No hedging and no padding. `may possibly be related to` is either evidence or it is
     nothing.

5. Say what the task is not. A performance task with a metric attached is a candidate for a
   run of many attempts, and `experimentation` owns that loop. A task whose fix needs a
   design decision says so, so it gets planned rather than picked up on a Friday. Do not
   attach a metric target you invented; `pre-implementation` picks the number, on a
   reproduced case.

6. Set the priority from the cost-to-leave answer in `playbooks/route-it.md`, and write that
   answer in the task. A priority with no stated cost gets re-argued by the next person to
   look at the board.

7. Write the ledger row, for every verdict and not only for the filed ones. Fingerprint,
   window, count, verdict, the ref where there is one, the trip condition where there is
   one. A drop with no row is a drop that gets re-read next week.

## Worked example

Before, filed straight off the error tracker:

> **TimeoutError in ExportWorker.run (4,213 events)**
> Sentry link. Seems to have gotten worse recently. We should investigate the export
> pipeline and possibly look at whether the S3 client upgrade is related. Might need a
> perf fix here, or maybe just bump the timeout. Assigning to backend.

After:

> **Exports over ~50MB time out after 30s** `fp:TimeoutError@ExportWorker.run`
>
> **What happens.** Any export where the source data is over roughly 50MB fails. The user
> sees "Export failed, try again". Retrying fails the same way.
>
> **Evidence.** 4,213 events since 08-14, 61 distinct tenants, rate 8x the previous
> fortnight. Trace `a91f...` and profile at `artifacts/export-a91f.cpuprofile`.
>
> **Cause.** `ExportWorker.run` fetches every row before writing any (`export/worker.py:88`)
> and the 30s socket timeout in `s3_client.py:24` fires during the fetch. First appears in
> the release that upgraded the S3 client, which shortened that default.
>
> **Reproduce.** `just export-fixture large.json` against staging fails in ~30s.
>
> **Blast.** 61 tenants, user-visible, no data written wrong.
>
> **Done when.** A 200MB export completes, and this fingerprint stops appearing.

The title carries the behaviour and the fingerprint rather than the exception class. `Seems`
and `possibly` were either evidence or nothing, and became evidence. The two competing
guesses were resolved by reading, which is the reading the first version handed to the next
person. `Done when` replaced "assigning to backend", which said who owned it and not what
finishing meant.

**Reply:** what you filed with the refs, what you merged into, what you recorded without
filing, and the ledger rows written.
