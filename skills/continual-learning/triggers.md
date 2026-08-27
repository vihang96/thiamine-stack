# Trigger examples: continual-learning

Prompts that must load this skill, and near-misses that must not.

This skill sets `disable-model-invocation`, so the prompts below describe when you should
type `/thiamine:continual-learning`, not when the agent picks it up on its own. Where the
skills are symlinked rather than installed as a plugin, the name is `/continual-learning`.

## Should fire

- mine my earlier chats for anything worth remembering
- refresh the project memory for this repo
- what did we learn in the last few sessions
- run the continual-learning loop
- you keep forgetting how I like commits written, go find it in the transcripts

## Should not fire

- remember that I prefer tabs over spaces. A single fact stated right now, so write it
  directly rather than mining transcripts for it.
- add a rule about swallowing exceptions. That is thiamine-author, because a rule is a
  portable standard rather than a fact about this project.
- what did I ask you to do earlier in this session. Already in context, so no mining is
  needed.
- summarize this conversation. A summary is not a durable memory.
