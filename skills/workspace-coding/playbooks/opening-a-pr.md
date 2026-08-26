### Opening a PR

**One pull request per repo the change touches, opened in dependency order.** For "open a
PR", and at the end of any change that is ready for review.

1. Check the diff is the change. Run the repo's own lint and tests in each worktree first.
   A pull request opened red spends a reviewer's attention on something you already knew.

2. Open in dependency order. Where one repo publishes a contract another consumes, the
   contract PR goes first and its number goes in the consumer's description. A reviewer
   who cannot tell which lands first has to work it out from the diff.

3. Title each one in the repo's commit convention, since squash-merge turns the title into
   the commit message and release tooling reads it. `rules/commit-messages.md` covers the
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
   under time pressure.

5. Open ready, not draft. Some tools default to draft, so check after creating and run the
   host's ready command if it opened as one. A draft does not request review, so it sits.

6. Do not start watching checks yet. Post the URLs and finish the other repos first.
   Driving one PR to green while another is unopened spends checks on a state that is
   about to change.

**Reply:** one line per repo with the PR URL and the order they land in. Name what you ran
before opening and what it reported. Do not paste the diff.
