# Trigger examples: unslop-typescript

Prompts that must load this skill, and near-misses that must not.

## Should fire

- review this TypeScript diff before I push it
- why does this need three casts to compile
- this function returns Promise of unknown and every caller re-parses it
- add a field to this result type
- the compiler is complaining, just make the error go away
- write the parser for this webhook payload

## Should not fire

- clean up this PR description. That is prose, so unslop-prose owns it.
- rename this Python function. Not TypeScript.
- why is the build failing on a missing dependency. A build error with no type in it.
- restructure the docs for this module. Document-level work, owned by technical-writing.
- should this be a rule or a skill. That is thiamine-author.

## Fires alongside unslop-prose

A TypeScript change carries comments, a commit message, and sometimes a doc. This skill
owns the types. `unslop-prose` owns the sentences, including the safety comment on an
assertion.
