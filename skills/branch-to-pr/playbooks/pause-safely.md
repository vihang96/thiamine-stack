### Pause safely

**Own a clean stop, and leave a checkpoint a cold-start agent can resume from.** For
"pause", "I need to stop", "restart the machine", and when context is about to compact.

This is explicit only. "Keep going", "going to bed, keep going", and "don't stop" mean
continue.

1. Stop at a safe boundary. Finish the current atomic step or back out of it. Never stop
   mid-edit with a tree that does not build. Start nothing new, and cancel any subagents.

2. Do not cross an irreversible line in order to pause. No new pull request and no first
   push. Pushing to a branch that already has one is fine.

3. Make the work durable in every worktree the change touches. Commit each one as a single
   `wip:` commit on its branch. Run the audit first, because a multi-repo change is easy
   to half-remember, and a worktree left dirty in a repo you forgot is the one that gets
   cleaned up later by someone reading flags.

   If a tree is broken, say so in one line of the commit body rather than leaving it for
   the next session to discover.

4. Bring the record up to date, in a file rather than in the conversation. Context that is
   about to compact will not survive, which is the case this exists for. The record is
   `<workspace>/.handoff-<branch>.md`, and the `handoff` skill owns what goes in it.

   If one was kept during the build, finish it: the current state at the top, and anything
   decided since the last entry appended below. If none was kept, write it now, and expect
   the reasoning to be thinner than it would have been.

**Reply:** where you stopped, what is on disk versus still in your head, the commits you
made per repo and whether each tree is clean, the path to the resume note, and the first
action on resume. This is a pause, not a final report. Do not summarize the work.
