# Trigger examples: technical-writing

Prompts that must load this skill, and near-misses that must not.

## Should fire

- review this README
- write the RFC for the new cache layer
- is this how-to structured correctly
- draft a PR description for this branch
- these docs feel like four documents fighting each other
- split this page up, it explains and instructs at the same time

## Should not fire

- rename this function to something clearer — naming in code, not a document
- why is this test failing — debugging, no prose involved
- make this paragraph sound less like a robot — that is unslop-prose alone; no
  document-level decision is in play

## Fires alongside unslop-prose

Not a conflict. A PR description or a README is both a document with a mode and prose
with sentence-level tells, so both skills apply. Each skill's Scope section says which
one wins where they disagree.
