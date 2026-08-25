# Trigger examples: unslop-prose

Prompts that must load this skill, and near-misses that must not.

## Should fire

- clean up this PR description
- this reads like AI wrote it
- cut the filler out of this paragraph
- make this commit message sound like a person wrote it
- too many em dashes in here
- this Slack message is way too formal

## Should not fire

- rename this variable. Code, not prose.
- why is the build failing. Debugging, with no prose involved.
- restructure these docs, they mix a tutorial and reference. Document-level work, which
  technical-writing owns.
- write the API reference for this module. Authoring a document with a mode. This skill
  applies to its sentences afterwards, not to the decision of what to write.
