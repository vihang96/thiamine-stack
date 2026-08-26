# Trigger examples: unslop-python

Prompts that must load this skill, and near-misses that must not.

## Should fire

- review this Python diff before I push it
- why does this function take a dict and return a dict
- this except block is swallowing the real error
- add a pytest test for the retry path
- set up a new Python project
- add httpx as a dependency
- these tests all patch the same function and assert it was called

## Should not fire

- clean up this PR description. That is prose, so unslop-prose owns it.
- rename a struct field in the Rust crate. Not Python.
- why is CI failing to install the toolchain. A build failure with no Python in it.
- restructure the docs for this package. Document-level work, owned by technical-writing.
- should this be a rule or a skill. That is thiamine-author.

## Fires alongside unslop-prose

A Python change carries docstrings, log messages, and the reason on a `# noqa`. This skill
owns the code. `unslop-prose` owns those sentences.
