### Opening a PR

**One pull request per repo the change touches, opened in dependency order.** For "open a
PR", and at the end of any change that is ready for review.

1. Check the diff is the change. Run the repo's own lint and tests in each worktree first.
   A pull request opened red spends a reviewer's attention on something you already knew.

2. Open in dependency order. Where one repo publishes a contract another consumes, the
   contract PR goes first and its number goes in the consumer's description. A reviewer
   who cannot tell which lands first has to work it out from the diff.

   Within one repo, a change too large to review in one piece is a stack rather than a
   sequence of independent pull requests. See `playbooks/stacked-prs.md`.

3. Title each one in the repo's commit convention, since squash-merge turns the title into
   the commit message and release tooling reads it. `rules/why/commit-messages.md` covers the
   format and how the type maps to a version bump. Name a real symbol in the subject when
   one carries the change.

   Check whether the repo squash-merges before assuming the title matters more than the
   commits. Where it merges commits as they are, the individual messages are what ship.

4. Write the description in these sections, dropping any that would be empty:

   - `## Why` the intent, and why this approach rather than another
   - `## Scope` facts from the diff, naming real symbols and paths, and both sides of a
     rename
   - `## Tradeoffs` real choices only
   - `## Blast radius` what this touches and why it is safe or risky
   - `## Verification` what you ran and what it reported, not just the command

   Never `## Summary` or `## Test plan` boilerplate. Apply the `unslop-prose` and
   `technical-writing` skills to the title and body, because both are prose a person reads
   under time pressure. Apply them by running them, not by having read them. Knowing the
   rules and having applied them feel identical from the inside, and only one of them
   changes the text.

   Keep it short enough to be read in full before the diff is opened. A description a
   reviewer skims is worse than a shorter one, because the parts they skip are the parts you
   most wanted read. A couple of sentences a section is usually right, and a section that
   needs a paragraph is often a change that needs splitting.

   The description is for reviewing, not for justifying. That is the distinction that
   controls the length. Cut whatever argues that the work was good: the bugs you found on the
   way, the alternatives you weighed, the tests you are pleased with. Those belong in the
   commits or nowhere. What earns a place is what changed, what is risky, and what you ran.

   The test is whether a reviewer could say, after reading it, what to look at hardest. When
   they could not, the problem is which facts you chose rather than how many.

   This names a bar, not a number. Where the person you are working for has a length
   preference, theirs is the number, and `capture-preferences` owns recording it.

5. Open ready, not draft. Several tools default to draft, including `gh stack submit`
   unless you pass `--open`. Check with `gh pr view` after creating rather than assuming,
   and run the host's ready command if one opened as a draft. A draft requests review from
   nobody, so it sits until someone notices.

6. Do not start watching checks yet. Post the URLs and finish the other repos first.
   Driving one PR to green while another is unopened spends checks on a state that is
   about to change.

**Reply:** one line per repo with the PR URL and the order they land in. Name what you ran
before opening and what it reported. Do not paste the diff.
