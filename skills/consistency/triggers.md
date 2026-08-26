# Trigger examples: consistency

Prompts that must load this skill, and near-misses that must not.

## Should fire

- add a date picker to the settings page
- which database should this new service use
- we are starting a new service, set up its architecture
- there are three different ways to return errors in this repo
- write an ADR for this decision
- how do other services here handle retries
- I need to add pagination to this endpoint

## Should not fire

- this helper is copy-pasted in four files. That is duplication, and rules/RULES.md Reuse
  owns it.
- rename this variable for clarity. Nothing about a pattern.
- get this PR green. That is multi-repo-mechanics.
- what does this function do. That is investigation, in pre-implementation.
- make this query faster. Performance, unless it turns out the answer is a different store.

## Fires alongside pre-implementation

Both run before code. `pre-implementation` works out what to build and what is unknown.
This works out whether the approach matches what already exists. A new service needs both,
and the survey usually comes first, because it changes what the unknowns are.
