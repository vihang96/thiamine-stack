### Generate hypotheses

**Read the failures and cluster them. The clusters are the hypotheses, already ranked.** For
starting a loop, and for a run whose ideas have all started to look the same.

Brainstorming produces a list of plausible changes in one shape, usually whichever shape the
last successful attempt had. Clustering the failures produces a list of causes, ordered by
how much of the gap each one owns, and it tells you when to stop looking at a category
because nothing is failing there.

1. Pull the per-item scores from the harness and sort by how badly each item did.

2. Delegate the reading to the `curator` agent. Reading two hundred failing items
   in this context spends what the next thirty attempts need, and the conclusion is six lines.
   The agent returns clusters with counts, the share of the gap each caps at, and a mechanism
   where the evidence shows one.

   Where the volume is large enough that one agent cannot read it either, fan out one lane per
   slice per `fan-out-work`'s read-only shape, and reconcile the clusters yourself, because two
   lanes will name the same cluster differently.

   Read a handful of items yourself anyway. Not to redo the clustering, but because the agent
   cannot tell you whether the failures match the complaint that started the run, and you can.

3. Count each cluster and work out what it is worth. A cluster covering a fifth of the
   failures caps what fixing it can buy you. This is the ranking, and it is the thing that
   stops a run spending eight attempts on a cluster worth two percent.

4. Turn each cluster into a hypothesis that names a mechanism. The cluster says what fails.
   The hypothesis says why, specifically enough to be wrong.

   Weak: "improve the prompt for tables". Strong: "the model sees the page in reading order,
   so a total below a page break arrives before the rows it summarises, and stating the
   table's extent before extraction should fix that ordering".

   A hypothesis you cannot state a mechanism for is a guess, and guesses belong at the back
   of the queue behind every mechanism you have.

5. Keep the categories diverse, because a run drifts into one kind of change. For a prompt,
   the categories are the instruction itself, which examples are shown and in what order,
   the output shape you demand, how the task is decomposed, what context is supplied, and
   what happens on uncertainty. For code, they are the algorithm, the data structure, what is
   cached, what is done concurrently, what is done at all, and what happens on failure.

   When three consecutive attempts came from one category, take the next from a different
   one whatever the ranking says. A run that only ever rewords instructions will find the
   best wording of the wrong instruction.

6. Prune before spending. A category with no failures in its cluster is not worth an attempt,
   however promising it sounds. This is the cheapest pruning available and it happens before
   any cost.

7. Re-cluster after every few accepted changes. The failure distribution moves as you fix
   things, and a hypothesis queue built against the original distribution goes stale. The
   cluster that was a fifth of the failures may now be most of them, or gone.

**Reply:** the clusters with their counts and what each caps at, the hypotheses in the order
you will try them with the mechanism each names, the categories they span, and what you pruned
before spending anything on it.
