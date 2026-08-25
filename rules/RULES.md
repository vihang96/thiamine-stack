# Engineering standards

These apply to every change in this repo, whether written by a human or an agent.
They are terse on purpose. Each has a longer rationale in `rules/<id>.md` — read it
when the rule seems wrong for the situation at hand.

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

## Errors

- Let it fail. `try/except` that logs and continues converts a loud bug into a silent one.
- Catch only what you can actually handle, and handle it.
- No defensive branches for states that cannot occur.

## Comments and docs

- Comment *why*, never *what*. If the code needs a narration, fix the code.
- Do not add a README, CHANGELOG entry, or summary doc unless it was requested.
- No decorative headers, banner comments, or emoji.

## Tests

- A test that asserts on a mock's return value tests the mock.
- Write the failing test first when fixing a bug; it is the only proof the fix works.
- No tests added purely to move a coverage number.

## Claims

- Never say something works without having run it. Paste what you ran.
- If it was not verified, say "not verified" and name what would verify it.
- Report what actually happened, including the parts that failed.

## Diffs

- One concern per commit. Refactor and behavior change do not travel together.
- Deleting code is a valid deliverable. Prefer it to adding.
