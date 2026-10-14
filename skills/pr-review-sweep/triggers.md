# Trigger examples

## Should not fire

- "Review this single diff." The interrogation skill owns an ordinary single review.
- "Fix the bug from this review." Implementation owns the fix.
- "Merge all green PRs." This skill does not merge.

## Should fire

- "Sweep open Ari PRs from the last week that nobody has reviewed."
- "Run the daily PR watcher and follow up on addressed comments."
- "Re-review the PRs tracked by the last review sweep."

Automatic discovery must be checked in a new Codex session after installation.
