# Trigger examples: unslop-rust

Prompts that must load this skill, and near-misses that must not. A manual rehearsal
today. They become `claude plugin eval` cases when that command leaves early access.

## Should fire

- review this Rust diff before I push it
- why does this function return Result of String
- this test just asserts the constant equals itself
- add a variant to this error enum
- the borrow checker is complaining, get it to compile
- set up lints for this new crate
- wrap this FFI call

## Should not fire

- clean up this PR description. That is prose, so unslop-prose owns it.
- rename this TypeScript type. Not Rust, so unslop-typescript owns it.
- why is cargo failing to resolve a dependency. A build failure with no Rust in it.
- restructure the docs for this crate. Document-level work, owned by technical-writing.
- should this be a rule or a skill. That is thiamine-author.

## Fires alongside unslop-prose

A Rust change carries doc comments, panic messages, and the reason text on an override.
This skill owns the code. `unslop-prose` owns those sentences.
