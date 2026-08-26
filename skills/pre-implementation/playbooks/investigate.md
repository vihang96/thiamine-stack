### Investigate

**Understand what exists before changing it, and produce something citable.** For "how does
X work", "why is it built this way", and the reading that precedes any change to code you
did not write.

Read-only. This produces an explanation, not a diff. If it turns into a change, stop and
start the change deliberately.

1. Find the real entry point rather than the first match. Search for the behavior, not the
   word. A grep for a feature name finds the label and the test. The code that does
   the work is often named for the mechanism instead. Follow a real call path from a caller you
   can name to the thing that does the work.

2. Read the history where the code is surprising. `git log -p` on the file, and the pull
   request that introduced the odd part, usually answers why faster than reasoning about it.
   Code that looks wrong and has survived is often load-bearing for a reason nobody wrote
   down. The commit that added it is where that reason is.

3. Follow it across repos. In a workspace the call leaves the service and lands somewhere
   else, and the interesting behavior is often on the other side of a boundary. Note which
   repo each piece lives in, because that becomes the blast radius and the plan.

4. Name what you did not find. An investigation that reports only what it found reads as
   complete when it is partial. Say which paths you did not follow, which callers you could
   not enumerate, and what would settle the parts you are unsure of. This is the section
   that stops a plan being built on a gap.

5. Cite everything. Every claim names a file and a symbol, so the next reader can check you
   rather than trusting you. A claim you cannot cite is a guess, and it should say so.

**Reply:** what it does, how it works along the real path, where the pieces live by file and
repo, the gotchas that would catch someone changing it, and what you could not determine.
Answer the question that was asked first, then the context. Do not paste the code back.
