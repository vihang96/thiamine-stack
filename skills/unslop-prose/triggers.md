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

- rename this variable — code, not prose
- why is the build failing — debugging, no prose involved
- restructure these docs, they mix a tutorial and reference — document-level work,
  which technical-writing owns
- write the API reference for this module — authoring a document with a mode; this
  skill applies to its sentences afterwards, not to the decision of what to write
