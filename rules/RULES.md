# Engineering standards

These apply to every change in this repo, whether written by a human or an agent.
They are terse on purpose. Some carry a longer rationale in `rules/<id>.md`. Read that
file, where it exists, when the rule seems wrong for the situation in front of you.

## Scope

- Build what was asked. Nothing adjacent, nothing anticipatory.
- If a change requires touching something out of scope, say so and get agreement
  before doing it. Do not fold an unrequested refactor into a feature diff.
- Leave discovered problems as a stated observation, not an unrequested fix.

## Abstraction

- Solve the case in front of you. Add the abstraction on the second real use, not the first.
- No config knobs, strategy interfaces, or extension points without a present caller
  that needs them.
- Prefer editing an existing file over adding a new one. A new module needs a reason
  that survives being said out loud.
- A wrapper with one caller is a rename. Inline it, along with the adapter that has no
  second implementation and the layer added for a future that did not arrive.
- Count what a reader has to carry: the hops between the question and the answer, and the
  state that can change the answer. Both are budgets, and they are independent.

## Reuse

- Search before writing a helper. Most helpers already exist under a different name.
- Two copies of a thing is a signal, three is a defect.

## Scaffolding

- When a migration lands, delete the scaffolding that carried it. Two names for one type,
  a re-export kept for compatibility with no live external consumer, and migration-era
  words in names, comments, or test titles are all leftovers.
- Migration vocabulary dates the code. `staged`, `legacy`, and `new-style` describe a
  moment that has passed, and they outlive whoever remembers it.

## Errors

- Let it fail. `try/except` that logs and continues converts a loud bug into a silent one.
- Catch only what you can actually handle, and handle it.
- No defensive branches for states that cannot occur.

## Retries

- Anything that can be retried will be. A crash, a timeout, and at-least-once delivery all
  replay the same step, so write it to leave the same state the second time as the first.
- Name the key that makes repeating it safe, in the code rather than in your head. Without
  one, the version that looks safe is the one that has not been retried yet.

## Debugging

- Reproduce it before changing anything. A fix for a failure you cannot trigger is a guess
  you have no way to check.
- Trace the symptom to its cause before fixing. Where a failure surfaces is rarely where it
  starts, and a fix at the surface leaves the cause to break something else later.

## Comments and docs

- Comment *why*, never *what*. If the code needs a narration, fix the code.
- Comment only where the code cannot say it itself. Keep it short and human-readable.
- Describe what the code does now. A comment about a mechanism that was deleted, or about
  how the code came to look this way, is history that will outlast its readers.
- Do not add a README, CHANGELOG entry, or summary doc unless it was requested.
- No decorative headers, banner comments, or emoji.

## Tests

- A test that asserts on a mock's return value tests the mock.
- When fixing a bug, write the test that fails before the fix. It is the only proof the
  fix works. Skip it for trivial or documentation-only changes.
- No tests added purely to move a coverage number.

## Claims

- Never say something works without having run it. Paste what you ran.
- If it was not verified, say "not verified" and name what would verify it.
- Report what actually happened, including the parts that failed.
- Build the tool that does it or proves it. A script a reviewer can rerun outlives a claim
  they have to take on trust, for the same effort spent once.

## Diffs

- One concern per commit. Refactor and behavior change do not travel together.
- Write the commit message in the repo's own convention, and check the repo for what that
  is before guessing. Where release tooling reads commits, the message is an input to a
  build rather than a note to a reader.
- Keep the subject short and imperative, under the limit the repo enforces. Put the why in
  the body, and only when it is not obvious from the diff.
- Deleting code is a valid deliverable. Prefer it to adding.
