### Wait for a predicate

**Write down a command that passes when the work becomes safe to start, then arm something
to evaluate it.** For work that has to follow another unit, usually because it consumes a
contract that has not landed.

A duration is not a predicate. "Check back in an hour" cannot pass or fail, and it produces
an hour of waiting followed by a guess.

1. Write the predicate as a command that exits 0 when the blocker has cleared. It goes on
   the `waiting-on` line of your board entry, so it is checkable by hand and by anything
   else. The common ones:

   ```sh
   # the contract landed on the default branch
   git -C orders-schema fetch -q origin &&
     git -C orders-schema merge-base --is-ancestor "$sha" origin/HEAD

   # the pull request merged
   [ "$(gh pr view 47 --json state -q .state)" = MERGED ]

   # the branch is gone, which usually means merged and tidied
   ! git -C orders ls-remote --exit-code --heads origin feat/retention >/dev/null 2>&1

   # the symbol you need exists at the tip
   git -C orders-schema fetch -q origin &&
     git -C orders-schema grep -q 'RetentionPolicy' origin/HEAD -- src/
   ```

   Keep it read-only, since `scripts/ready.sh` executes it, and prefer a fact about the
   remote over a fact about your local checkout. A predicate that passes because of
   something you did locally is not evidence that anybody else's work landed.

2. Arm the best mechanism the session has. All three evaluate the same predicate, which is
   why the predicate rather than the timer is the thing you write down:

   - **The session stays open.** Watch the predicate in the background and pick the work up
     when it passes. Whatever the harness offers for waiting on a condition does this; a
     backgrounded shell loop that exits on success works anywhere.
   - **The session ends and there is a scheduler.** A periodic tick runs
     `sh scripts/ready.sh <workspace-root>` and starts what is ready.
   - **Neither.** Nothing extra is needed. The next session runs `ready.sh` as part of
     `playbooks/declare-and-discover.md`, and the queued unit shows up as READY.

   Say which one you armed. An unarmed wait is a plan to remember something.

3. Set an expectation for how long, and surface it rather than waiting silently past it.
   `ready.sh` flags a unit that has waited over a day as overdue. Waiting forever looks
   exactly like working, which is why this needs a mechanism rather than patience.

4. When it fires, re-run the overlap check before starting. The predicate passing means the
   blocker cleared, not that starting is safe: other units began while you waited, and the
   thing you were waiting for may have changed the answer to a question your work depends
   on. Step 1 of the skill, again, then start.

5. Clear `waiting-on` from your entry when you begin. A unit that is running but still
   reads as waiting makes the board wrong for everyone.

**Reply:** the predicate as a command, what you armed and where it runs, how long you expect
it to be blocked, and what you are doing meanwhile. If nothing can proceed until it fires,
say that explicitly, because it is the one case where the session genuinely has nothing to
do.
