### Cluster the queue

**Collapse events into items before judging any of them.** For a queue of thousands, a
first pass over a source nobody has read, and any moment when the list is longer than you
can hold.

Judging events one at a time produces a ranking of whichever ones you happened to read
first. Volume has to collapse before severity means anything.

1. Fingerprint every event, per the key in `SKILL.md`. Stable parts only: the exception type
   plus the topmost frame in code you own, the endpoint plus the status, the log template
   with its ids and numbers stripped. If two events differ only in a uuid, they are one item,
   and a fingerprint that says otherwise makes the queue unreadable for good.

2. Group by cause, never by category. `timeouts on the export endpoint after the S3 client
   upgrade` is an item; `errors in the export service` is a folder. The test is whether one
   change could plausibly fix the whole group.

3. Delegate the reading when it does not fit. The `curator` agent takes the failing cases
   and returns clusters with counts and the share each one owns. It is written for an
   improvement run's failures, and a triage queue is the same material: many cases, one
   question, more text than a context window. Give it the events and the fingerprints, take
   back the clusters, and keep the raw events out of the main thread.

4. Attach the four numbers an item needs before you can rank it. Count in the window, how
   many distinct users or tenants, first seen, and the trend against the previous window.

   First seen is the one people skip and the one that says the most: an item first seen
   the day of a release is a regression with a suspect attached, and an item first seen
   fourteen months ago is a tolerated cost that something just made visible.

5. Rate, not count, across windows. Traffic doubled means everything doubled. An item whose
   share of requests is flat did not get worse, and treating it as though it did is how a
   sweep files three tasks about a successful marketing campaign.

6. Separate the observer from the observed. A spike that starts when a release changed the
   logging, a monitor that began sampling differently, a client retrying more often: the
   system may be unchanged and the instrument new. Check what changed on the measuring side
   before filing a task about the measured side.

7. Say what you read. How many events, how many items, and where you stopped. A cluster list
   reads as complete even when it is not, so a sweep that read the top forty of nine thousand
   has to say so.

**Reply:** the items, each with its fingerprint, count, distinct users, first seen, and
trend, ranked by what it costs to leave. Say how many events collapsed into them and how
many you read.
