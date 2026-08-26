---
id: idempotence
summary: Anything that can be retried will be, so write each step to leave the same state the second time as the first.
enforced_by: review, and the incident that follows a retry. No linter decides this.
---

# Idempotence

## The failure it prevents

A nightly job times out halfway through a backfill and the scheduler runs it again. The
rows it already wrote get written a second time. Nobody notices, because the job now
reports success and the duplicates look like real records, until a monthly total is wrong
and someone spends a day working out which run produced which row.

The same shape appears wherever a step can run twice: a webhook delivered at least once, a
queue consumer that crashes after doing the work and before acknowledging it, a deploy hook
that reruns, a user double-clicking submit, a migration re-applied against a database that
was restored from a snapshot.

The cost is not that it fails. It is that it succeeds, twice, and the damage is discovered
somewhere else much later.

## The rule

Write each step so that running it twice leaves the same state as running it once, and
name the thing that makes that true.

## What counts

The usual mechanisms, in rough order of how much they cost:

- A natural key and a uniqueness constraint, so the second write is rejected by the
  database rather than by your code remembering.
- An upsert, where the operation is a statement about the end state rather than a delta.
- An idempotency key supplied by the caller and recorded, so a retry is recognised as the
  same request.
- A conditional update guarded by the current state, so a transition only fires from the
  state that permits it.

Increments, appends, and sends are the operations that are not naturally safe. `count = count
+ 1` and posting a message are the two that catch people, because both look like single
actions and both replay.

Write down which mechanism applies, in the code near the operation. A step is not idempotent
because you thought about it once.

## When to override

An operation genuinely nobody can retry, such as a one-off run behind a manual gate, does
not need the machinery. Say that is the assumption, because the next person to wire it into
a scheduler will not know.

Where making it idempotent is genuinely expensive, make it detectable instead. A duplicate
you can find later beats one you cannot.

## Signals you have violated it

- The safety argument is about timing rather than about state.
- A retry is described as unlikely rather than as handled.
- The step reads or writes a counter, appends to a list, or sends something outward, and
  nothing in the code says what happens on the second pass.
- Recovering from a partial failure means someone reading the logs to work out where it got
  to.
