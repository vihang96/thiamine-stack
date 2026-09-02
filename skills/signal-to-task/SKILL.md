---
name: signal-to-task
description: "Carries a signal from a running system to a disposition: an alert, a crash group, a trace or a profile, a slow endpoint, a failed run, a complaint in a channel, a ticket nobody has read. Reduces it to one claim with evidence, diagnoses it from a capture or a live process, decides whether it earns work, and files the task or drops it on the record. Use when triaging an error queue or an inbox of feedback, when asked why production is slow or leaking, when a trace or heap snapshot needs reading, when an infra error nobody sees needs a home, and for what should we do about this."
owns: "an unsolicited signal from a running system, from arrival to disposition"
see_also: [pre-implementation, interrogate, branch-to-pr, experimentation, handoff, fan-out-work, curator, unslop-prose]
---

# Signal to task

A queue of signals is not a list of tasks. Errors, alerts, traces, failed runs, and
complaints arrive from systems nobody was watching, in volumes nobody can read, and two
things go wrong from there.

Nothing leaves. The same four thousand events get re-read every week, each sweep starting
from zero, and the item that mattered was on page nine both times. Or everything leaves as a
ticket, and the backlog fills with `investigate slow endpoint`, each one handing the reading
back to whoever picks it up.

This skill owns arrival to disposition. It ends when every signal you looked at has a
verdict on a record, and the ones that earned work are tasks a stranger to the system can
act on.

## If it is on fire, this is the wrong skill

An active incident is mitigation work: roll back, fail over, shed load, stop the bleeding.
Do that, and triage what is left afterwards. A skill that tells you to fingerprint a queue
while checkout is down is one you learn to skip when it matters.

## Three rules that outrank the rest

**Every signal leaves with a verdict.** Including the boring ones, and including the ones
you drop. An item with no verdict is not a decision deferred, it is a decision the next
sweep has to make again at full price. The record is what makes the queue shrink.

**Volume is not severity.** Four thousand events from one retry loop are one item. One
event that wrote a row into the wrong tenant is the top item. Count to size the thing, rank
by what it costs to leave it.

**A task carries the evidence or it is not a task.** The claim, the artifact, the source
location, the fingerprint. And the words are for someone who has never seen this code:
short sentences, plain nouns, no internal shorthand. `playbooks/file-the-task.md` owns that,
and it is the half of triage most often skipped.

## Scope

This skill owns the signal until it becomes a task, a merge, a watch, or a drop.

- `pre-implementation` takes over the moment a signal earns work: reproducing it, root
  cause, blast radius, and the plan. Its `pick-a-metric` playbook owns the number a
  performance push is measured against. Do not pick one here beyond the measurement that
  justified filing.
- `branch-to-pr` lands the fix. Its `triage-review-comments` playbook is a different
  inbound: comments on your own change, which arrive from a person who read your diff.
- `interrogate` judges an artifact a person or an agent produced. A signal was produced by
  nobody, which is why it is here: there is no author, no intent, and no claim to check.
- `experimentation` owns a sustained run against a metric. A filed performance task with a
  target and thirty attempts ahead of it belongs there, not in another sweep.
- `handoff` owns the record of the session. The ledger below is a record of the queue.
- `curator` does the clustering when there is more than fits in one context. `fan-out-work`
  owns subagents in general; forensics uses one to keep a large capture out of the main
  thread.

Not owned: the fix itself, and the design of the alert that should have caught this. A
missing alert is a fine thing to file, but writing it is ordinary work.

## The verdicts

Six, and each one names the thing that leaves the queue. A verdict that leaves nothing
behind is a feeling.

| Verdict | When | What leaves |
| --- | --- | --- |
| `fix now` | shipped behaviour is broken, data is at risk, or the fix is smaller than the task describing it would be | a change, via `pre-implementation` then `branch-to-pr` |
| `file` | real, ours, worth someone's day, but not this hour | a task carrying the evidence |
| `merge` | the same fingerprint as an item already open | a note on that item with the new count and window, and nothing new filed |
| `watch` | real, below the bar, or self-healing | a trip condition and a re-check date in the ledger |
| `drop` | not real, not ours, or gone | the reason and the fingerprint, so the next sweep skips it |
| `ask` | user-facing, money, security, tenancy, or a product call | one question to a person, and the item stays open |

Three calibrations. `watch` is not a polite `drop`: it needs a number that trips it, or it
is a drop that will be re-read forever. `drop` is only worth anything written down, and the
fingerprint is the part that stops the re-read. And `ask` costs a person an interruption, so
batch them and send one message with the list rather than six.

## Not user-facing is a verdict, not a filter

An error nobody sees still costs something, and the cost is usually indirect: it hides the
error that matters, it burns a retry budget, it is the reason the real signal was missed at
3am. Rank by what it costs to leave, not by who noticed.

Three shapes that earn a task with nobody complaining:

- An error that fires on every run, and is therefore invisible. Constant noise reads as
  background, and the queue is now unsearchable.
- A retry that eventually succeeds, hiding a dependency that is already broken. The signal
  is the retry count, not the failure, and it disappears the day the retries stop being
  enough.
- A cost, latency, or memory trend with a slope and no complaint yet. Filing it while it is
  cheap is the whole value; the metric and the baseline belong in the task.

The counterweight is real. A log line that annoys the person reading it and costs nothing
else is a `watch` or a `drop`. Filing those is how a backlog becomes something nobody opens.

## The ledger

One file per source, at `<workspace>/.thiamine/triage/<source>.tsv`, appended and not
edited. Plus `<source>.watermark` holding the timestamp or cursor the last sweep reached.

```
fingerprint  first_seen  last_seen  count  verdict  ref  trip  note
```

**The fingerprint is the key that makes a sweep safe to run twice**, which matters most here
because filing is a write to a tracker other people read. Build it from what is stable:
exception type plus the topmost frame in code you own, endpoint plus status, the query with
its literals stripped. Never the message, which carries an id or a timestamp and turns every
event into its own item. Filing is keyed on it, so the second pass finds the row and merges.

Advance the watermark only after the items behind it have verdicts. A sweep that dies
halfway and advanced first has dropped everything it had not read, and nothing says so
(`rules/why/idempotence.md`).

## Procedure

1. **Pull what is new since the watermark**, per `playbooks/standing-sweep.md`. On a first
   pass against a queue nobody has triaged, the watermark is the start of the window you
   choose, and you say which window you took.

2. **Fingerprint and cluster**, per `playbooks/cluster-the-queue.md`. Raw events become a
   short list of items with counts, windows, and trends. Volume collapses here or it
   contaminates every judgement after it.

3. **Diagnose the items that need a cause before a verdict.** Not all of them do: a `merge`
   or a `drop` rarely needs one, and a stack trace naming the line is already the
   attribution. Use `playbooks/trace-forensics.md` when a capture exists and
   `playbooks/runtime-forensics.md` when the process is still up and reproducing it.

4. **Route each item**, per `playbooks/route-it.md`. Real, new, whose, what it costs to
   leave, then the verdict.

5. **File, merge, or record**, per `playbooks/file-the-task.md`. Every verdict writes its
   row, not only the ones that became tickets.

6. **Advance the watermark and report the delta.** What is new since last time, what
   changed verdict, and what you did not reach. Not a re-listing of the queue.

## Playbooks

| Situation | Playbook |
| --- | --- |
| A recurring sweep of a source, and what to pull from each kind | `playbooks/standing-sweep.md` |
| Thousands of events, or a queue nobody has read | `playbooks/cluster-the-queue.md` |
| A capture exists: a profile, a trace, a heap snapshot, a log bundle | `playbooks/trace-forensics.md` |
| The process is up and doing it now | `playbooks/runtime-forensics.md` |
| Items are diagnosed and need verdicts | `playbooks/route-it.md` |
| A verdict has to become a task, a merge note, or a row | `playbooks/file-the-task.md` |

## Verify

The sweep is done when the ledger says so, and both of these are cheap to check:

```sh
awk -F'\t' 'NR>1 && $5==""' .thiamine/triage/*.tsv   # items with no verdict: must be empty
cut -f6 .thiamine/triage/*.tsv | grep . | sort | uniq -d   # one ref filed under two fingerprints
```

Then run the sweep again. A correct second run files nothing, reports no new items, and
leaves the ledger the same length. That is the check that matters once filing is unattended,
because the failure it catches is the one that reaches other people: thirty duplicate
tickets on a schedule.

## Do not

- File one ticket per event. That is the queue again, with worse latency.
- File a task that says investigate. If the diagnosis is not done, the verdict is `watch`
  or the next step is forensics, not a ticket with your reading missing.
- Read code to answer a question a capture already answers, or capture a profile to find a
  line a stack trace already names. Both are common, and they cost hours in opposite
  directions.
- Advance a watermark before the items behind it have verdicts.
- Let a sweep re-report what the last one reported. A loop that repeats itself trains the
  reader to stop opening it, and then the one real finding arrives to nobody.
- Fix things while triaging, other than the `fix now` items you named as such. A sweep that
  turns into an afternoon of small fixes leaves the rest of the queue unread and no record
  of why.
- Rank by count. It is the number the tool sorts by, and it is not the number that matters.
