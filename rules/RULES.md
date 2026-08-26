# Engineering standards

These apply to every change in this repo, whether written by a human or an agent.
They are terse on purpose, one line per rule. A section with a rationale names it
underneath. Read that file when the rule seems wrong for the situation in front of you.

## Scope

- Build what was asked. Nothing adjacent, nothing anticipatory.
- Out-of-scope work needs agreement first. Never fold a refactor into a feature diff.
- Leave a discovered problem as a stated observation, not an unrequested fix.

Rationale: `rules/why/scope.md`.

## Abstraction

- Solve the case in front of you. Abstract on the second real use, not the first.
- No config knob, strategy interface, or extension point without a caller that needs it.
- Prefer editing a file to adding one. A new module needs a reason said out loud.
- A wrapper with one caller is a rename. Inline it, with any adapter or layer earning nothing.
- Count both budgets: hops from question to answer, and state that can change the answer.

Rationale: `rules/why/reader-load.md`.

## Reuse

- Search before writing a helper. Most already exist under a different name.
- Two copies of a thing is a signal. Three is a defect.

## Scaffolding

- When a migration lands, delete the scaffolding that carried it.
- No migration vocabulary in names, comments, or test titles. `staged` and `legacy` date code.
- When a shape changes, move every reference with it: callers, types, tests, docs, examples.

## Errors

- Let it fail. A catch that logs and continues turns a loud bug into a silent one.
- Catch only what you can handle, and handle it.
- No defensive branch for a state that cannot occur.

## Retries

- Assume every step is retried. Leave the same state the second time as the first.
- Name the key that makes repeating it safe, in the code rather than in your head.

Rationale: `rules/why/idempotence.md`.

## Debugging

- Reproduce it before changing anything. A fix you cannot trigger is a guess.
- Trace the symptom to its cause. A fix at the surface leaves the cause to break elsewhere.

Rationale: `rules/why/root-causes.md`.

## Comments and docs

- Comment why, never what. If the code needs narration, fix the code.
- Comment only where the code cannot say it itself, and keep it short.
- Describe what the code does now. A deleted mechanism and a history are not documentation.
- No README, CHANGELOG entry, or summary doc unless it was requested.
- No decorative headers, banner comments, or emoji.

## Tests

- A test asserting on a mock's return value tests the mock.
- When fixing a bug, write the test that fails before it. Skip trivial and doc-only changes.
- No test added purely to move a coverage number.

## Claims

- Never say it works without having run it. Paste what you ran.
- If it was not verified, say "not verified" and name what would verify it.
- Report what happened, including the parts that failed.
- Build the tool that does it or proves it. A rerunnable script outlives a claim.

## Diffs

- One concern per commit. Refactor and behavior change do not travel together.
- Write the commit message in the repo's convention. Check the repo before guessing.
- Keep the subject short and imperative. Put the why in the body, and only when needed.
- Deleting code is a valid deliverable. Prefer it to adding.

Rationale: `rules/why/commit-messages.md`.
