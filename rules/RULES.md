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

## Diffs

- One concern per commit. Refactor and behavior change do not travel together.
- Deleting code is a valid deliverable. Prefer it to adding.
