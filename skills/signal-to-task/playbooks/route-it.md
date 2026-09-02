### Route it

**Four questions in order, then one verdict per item.** For a diagnosed or clustered item
that needs a decision, and any moment the answer is about to be "we should probably look
into that".

Order matters. Two of the four kill an item outright, and asking them last means you paid
for the reading anyway.

1. **Is it real?** A signal can be an artifact of its own collection: a monitor with the
   wrong threshold, a health check counted as a user, a synthetic client, a test tenant, a
   crawler. Confirm the thing happened to somebody or something before spending another
   minute. Not real is a `drop`, and the fingerprint goes on the record so the next sweep
   does not pay for it again.

2. **Is it new?** Search the tracker for the fingerprint and for the symptom in the words
   someone else would have used. An open item is a `merge`: add the new count and window to
   it and file nothing. A closed item that has come back is worth more than a new one,
   because the last fix is now evidence, and it gets filed as a regression naming the
   commit that closed it.

3. **Whose is it?** The service that emits the error is often not the one that owns the
   cause. Follow it to the code that decides the behaviour, then to whoever owns that code.
   A dependency's bug is a `file` against the dependency plus a decision here about
   tolerating it, and those are two different items.

4. **What does it cost to leave for a month?** This is the ranking question and it replaces
   severity guesswork. Say it in the units the item has: users affected, money settled
   wrong, runs failed, hours of on-call, the search that stops working because the queue is
   full of it. An item whose answer is "nothing" is a `watch` with a trip condition, or a
   `drop`.

5. Apply the verdict table in `SKILL.md`, then check it against the one thing that overrides
   ranking. These go to a person as `ask`, or straight to `fix now`, however small they
   look and however long the list already is:

   - data written wrong, lost, or crossing a tenant boundary
   - auth, permissions, sessions, or a credential in a log
   - money, billing, or a quantity that settles
   - anything a customer can see and is currently seeing

6. Set the trip condition on every `watch`, in numbers a later sweep can evaluate without
   you: a count, a rate, a distinct-user threshold, or a date. `watch if it exceeds 50 a day
   or reaches a second tenant` is a verdict. `keep an eye on it` is the queue again.

7. Batch the `ask` items into one message with the list and your recommendation per item.
   Six separate questions across an afternoon get one answer and lose the other five.
   `unslop-prose` owns the words: the question first, the context under it.

**Reply:** one line per item with its verdict and the reason, the `ask` list separately with
what you recommend, and the trip condition for each watch.
