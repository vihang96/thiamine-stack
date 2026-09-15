# Engineering standards

These apply to every change, whether written by a human or an agent. They are terse on
purpose, one line per rule. Where a section names a rationale in `why/`, read it when the
rule seems wrong for the work in front of you. Those paths sit beside this file, not in your
project: `readlink -f` this file, or read the `@` import line that pulled it in.

## Scope

- Build what was asked. Nothing adjacent, nothing anticipatory.
- A request that names a solution still has a problem behind it. State that first.
- Out-of-scope work needs agreement first.
- Ambiguous scope takes the narrowest reading. Name the wider one you did not take.
- Leave a discovered problem as a stated observation, not an unrequested fix.

Rationale: `why/scope.md`.

## Asking

- Answer it by looking. A question the repo already answers is work handed back.
- Ask what only a person can settle, and where being wrong is expensive or hard to undo.
- Act where it is reversible, then confirm the decision. Do not request it.

Rationale: `why/asking.md`.

## Abstraction

- Solve the case in front of you. Abstract on the second real use, not the first.
- No config knob, strategy interface, or extension point without a caller that needs it.
- Prefer editing a file to adding one. A new module needs a reason said out loud.
- A wrapper with one caller is a rename. Inline it, with any adapter or layer earning nothing.
- Count both budgets: hops from question to answer, and state that can change the answer.
- Search before writing a helper. Most already exist under a different name.
- Two copies of a thing is a signal. Three is a defect.

Rationale: `why/reader-load.md`.

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

Rationale: `why/idempotence.md`.

## Secrets

- Report that a secret is present, never its value. Test the variable and print your own words.
- A secret that reached a log, a transcript, or a chat thread is leaked. Rotate it.

Rationale: `why/secrets.md`.

## Debugging

- Reproduce it before changing anything. A fix you cannot trigger is a guess.
- Trace the symptom to its cause. A fix at the surface leaves the cause to break elsewhere.

Rationale: `why/root-causes.md`.

## Comments and docs

- Comment why, never what, once, and in two lines. If the code needs narration, fix the code.
- Describe what the code does now. A deleted mechanism and a history are not documentation.
- No README, CHANGELOG entry, or summary doc unless it was requested.

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

- Decide where a change lands before the first edit, not at commit time.
- One concern per commit. Refactor and behavior change do not travel together.
- Write the commit message in the repo's convention. Check the repo before guessing.
- Keep the subject short and imperative. Put the why in the body, and only when needed.

Rationale: `why/commit-messages.md`.
