### Audit the claims

**A summary is a claim, not evidence.** For a pull request description, an agent's final
report, a test plan, a hand-off note, or any artifact that asserts something was done.

`rules/RULES.md` already says never to claim it works without having run it. This is the
review side of that rule: the author's claims are the cheapest thing in the artifact to
check, and the most likely to be wrong in a way nobody notices.

1. List the claims. The description, the commit bodies, the final report, the checked boxes
   in a test plan, and any comment in the diff asserting behaviour. Write them down, because
   a claim you did not extract is a claim you did not check.

2. Sort each one by what backing it already has.

   - **Shown.** Output pasted, artifact linked, commit SHA, a run you can open.
   - **Cheap to check.** One command, one file to read, one grep.
   - **Not checkable here.** Needs an environment, real data, or a deploy you do not have.

3. Check the cheap ones yourself rather than reasoning about them. Run the test, exercise the
   path, open the file, grep for the caller that supposedly does not exist. One command
   settles what a paragraph of argument leaves open.

4. Treat a claim that does not resolve as a finding, with severity taken from what it hides.
   "Tests pass" with a failing test is blocking. "No other callers" with a caller three
   files away is blocking. "Should be equivalent" over a diff that changes behaviour is
   blocking. A stale line in a description nobody relies on is a note.

5. Watch for the shapes that survive a casual read.

   - **The paraphrase.** The summary describes intended behaviour, and the diff does
     something adjacent to it.
   - **The silent skip.** A step in the plan is absent from the change, and nothing says so.
   - **The passive verification.** "Should work", "is expected to", "presumably safe".
   - **The self-report.** A subagent said it passed, and nobody ran the thing it claimed.
     A lane's own report is evidence, not a verdict.
   - **Evidence from a different run.** Logs, screenshots, or timings that predate the last
     commit, or come from a different branch.

6. Return it as a table. Prose about claims reads as agreement even when it is not, and a
   table makes the unresolved rows impossible to skim past.

**Reply:** a table of claim, evidence offered, what you found, and verdict. Then the claims
you could not check, and the specific thing that would settle each one.
