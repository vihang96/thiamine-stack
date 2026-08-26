### Drive CI to green

**Own the checks until they pass. Do not merge.** For "get it green", "check on the PR",
and after opening a pull request that is ready for review.

Merging is the human's, after approval. This playbook ends at green, not at landed.

1. Read the state across every repo the change touches:

   ```sh
   sh scripts/pr-status.sh <branch> <workspace-root>
   ```

   It names each failing check. A change spanning repos is as green as its worst repo, so
   never report one repo green while another is red.

2. Fix the cause, not the symptom. Read the failing job's log before changing anything. A
   check that fails for a reason unrelated to the diff, such as a flaky integration test
   or a missing secret, is still worth naming, but it is not yours to paper over with a
   retry.

3. Push a fix as its own commit rather than amending, while the PR is under review. A
   force push invalidates what a reviewer has already read, and rereading a whole diff to
   find your one fix is the most expensive thing you can ask of them.

4. Wait rather than poll hard. Checks take minutes. Re-run the status script on a sensible
   interval rather than in a loop, and say what you are waiting on.

5. Stop when every repo reads green, and say so. Do not enable auto-merge, do not merge,
   and do not approve your own pull request. Green means ready for a human to look at.

**Reply:** the status line per repo, what failed and what you changed for each, what is
still running, and whether any failure was unrelated to this change. When it is green, say
that it is ready for review and stop.
