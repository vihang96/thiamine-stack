### Blast radius

**Find what this breaks somewhere else, and prove the fact it is safe because of.** For
"what could this break", before a change to shared code, and before any change to a
published contract.

Listing the callers is not the job. Grep does that in a second. The job is the breakage
grep will not show you.

1. Say what the change actually does, including the part the diff does not spell out. A
   field that becomes optional, an error that is now swallowed, an order that is no longer
   guaranteed. The unstated part is where the breakage lives.

2. Find the one fact it is safe because of. Most changes that look alarming are safe
   because of a single thing, such as this path only running for records that were already
   being discarded. Find that fact and most of the scary cases die together. Spend your
   effort here rather than on a long list of maybes.

3. Look where grep stops:

   - **Other repos.** A change to a published contract breaks the consumer, and the
     consumer is not in this checkout. Search the repos that depend on this one, not just
     this one.
   - **The wire.** JSON an API returns, a column another service reads, a queue message, a
     cached payload written by the old code and read by the new.
   - **Across languages.** A field renamed in a schema is a grep hit in one language and
     silence in the other three that read the same bytes.
   - **The library, not your call to it.** Read its source at the version actually pinned,
     including any local patch.
   - **Timing.** What runs before what, what happens on teardown, retry, or partial
     failure.
   - **Configuration.** A feature flag, an environment variable, a default that differs in
     production.

4. Do not trust your own writeup. A blast-radius writeup that sounds right is worthless,
   because it reads as convincing whether or not it is true. That is the trap. Words are
   where you start, not what you hand back.

5. Say how sure you are, per fact. Get each safety fact as far down this list as is cheap,
   and say where it stopped:

   | Level | What it means |
   | --- | --- |
   | 1 | You said so. Worth nothing on its own. |
   | 2 | You pointed at a real `file:line`, yours or the library's. |
   | 3 | You walked the failure step by step and it does not reach. |
   | 4 | You ran it. A script that calls the real code and fails loudly if you are wrong. |
   | 5 | You reproduced it in the running system. |

   Anything you cannot get to level 4 is unproven, and you say so rather than writing it up
   as settled. Level 4 is usually one small script that imports the same library the service
   ships and calls the exact function in question.

6. Be honest about each risk. A real chance of happening and a real cost if it does. Keep
   the risks you confirmed, and list what you checked and cleared separately, because a
   search that finds nothing is an answer worth recording. Cite a real `file:line`, and
   never invent a caller.

**Reply:** what the change does including the unstated part, the one fact it is safe because
of with its level and the proof, the real risks each with how it breaks and a citation, what
you cleared, and the cheapest check that would catch the real bug. Mark anything unproven as
unproven. Do not round up.
