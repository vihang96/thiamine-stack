---
name: thiamine-author
description: "Authors or revises a thiamine skill, agent, command, or rule from the repo templates, picking the right artifact type and validating it before finishing. Use when adding to or changing the thiamine stack, for should this be a rule or a skill, and when a recurring mistake should become a permanent standard."
requires: [thiamine-install]
see_also: [maintain-skills]
---

# Author a thiamine artifact

## Changing one that exists

Most requests that arrive here are edits, not new artifacts. `maintain-skills` routes findings
to this skill, and `continual-learning` stops at the boundary and hands the promotion over.
Take the edit path when the artifact exists, and skip to Step 7 to validate.

**Check the evidence before the file.** One incident is a preference; the same correction
twice is a standard. If you cannot name the second occurrence, say so and stop. A corpus
grows by one artifact per anecdote and then nobody reads it.

Then edit in place, under three constraints:

- **Preserve what nothing contradicts.** Revise the parts with new evidence. Leave the
  rest, including phrasing you would have written differently.
- **Prefer the edit to the sibling.** A second artifact next to an almost-right one is the
  near-duplicate Step 2 exists to prevent. Extending the existing one is nearly always
  right.
- **Re-read the description after changing the body.** This is the miss that matters. A
  skill whose body grew keeps its old triggers, so it stops loading for the work it now
  handles, and the failure is silent: the skill is never wrong, just never invoked. If the
  body does something the description does not name, the description is now a defect.

Then re-check what the change reaches: `owns:` and `see_also:` if the artifact annexed
ground a sibling held, and `triggers.md` for a "should fire" line covering the new
capability. Deleting is also an outcome. An artifact whose situation stopped occurring is
removed, not maintained.

## Step 1. Pick the artifact type

The distinction is **who decides to invoke it**. Get this right first. The wrong type is
the most common defect in a standards repo.

| Artifact | Who invokes it | Right when |
| --- | --- | --- |
| Rule (`rules/RULES.md`) | nobody, always loaded | it applies to essentially all work |
| Rule detail (`rules/why/<id>.md`) | agent, on demand | the rationale is long but the rule is one line |
| Skill | agent, from the description | "when X happens, do Y", X being recognizable |
| Skill + `disable-model-invocation: true` | you, typing `/name` | long content you want on demand only |
| Command | you, typing `/name` | a short procedure you trigger by name |
| Agent | delegated, isolated context | read-heavy work with a small output |

Two questions resolve most cases:

- Does it apply to a subset of work, such as one language, one file type, or one phase?
  Then it is a skill rather than a rule, even if it feels fundamental.
- Would you be annoyed if it fired unprompted? Then write a command, or a skill with
  model invocation disabled.

**"It must always apply" is not a skill.** Skill invocation is discretionary, so a skill
whose description claims to always apply fires unpredictably. Split it in two. Put a
one-line entry in `rules/RULES.md`, cheap enough to stay loaded forever, and put the
detail in a skill that the line routes to. The rule is the trigger. The skill is the
payload.

If the request is ambiguous, name the type you picked and say why in one sentence before
you write. Do not ask unless the choice changes the content.

## Step 2. Check that the territory is free

Read `rules/RULES.md`, then list `skills/`, `commands/`, and `agents/`. Read any sibling
whose subject touches yours.

A near-duplicate is worse than nothing. When two artifacts cover the same ground and
disagree, an agent can satisfy the weaker one and report done. If something close
already exists, either extend it, or add an `owns:` line and a `## Scope` section to
both, naming which one is authoritative where. Say which you did.

## Step 3. Pick the shape, then write it

Skills come in two shapes, and the wrong one makes a skill unusable:

- **`templates/skill/procedure.SKILL.md`** does something. Ordered steps, ending in
  verification.
- **`templates/skill/standard.SKILL.md`** judges something. Criteria that all apply at
  once, a worked example, and a review checklist.

The tell: sections that fall into a numbered time order mean a procedure, and groups of
criteria mean a standard. Never force a standard into "Procedure: 1, 2, 3".

Scaffold it. The script copies the template, substitutes the name, links new skills into
the other installed harnesses, and validates the result:

```sh
node scripts/new.mjs skill <name> --standard   # or --procedure
node scripts/new.mjs rule <id>
node scripts/new.mjs command <name>
node scripts/new.mjs agent <name>
```

Read the template's `README.md` before you fill it in, because it names the failure
modes for that artifact type. Delete any section you have nothing real to put in. The
validator flags placeholders you leave behind.

What matters most, by type:

- **Skill.** The `description`. It is the only text the agent sees when it decides
  whether to load the skill. Write it in third person, and name recognizable triggers.
- **Rule.** The "failure it prevents" section, with a concrete cost.
- **Agent.** The return contract and the disposition. "Try to refute this" beats "review
  this".
- **Command.** The stop conditions.

## Step 4. Declare dependencies

If the artifact tells the agent to apply another skill, read a file, or run a slash
command, that thing has to exist. This is the worst defect an artifact can carry. An
agent does not error on a missing dependency. It invents the contents and proceeds.

Declare every one, and pick the field by whether the artifact works without it:

```yaml
requires: [unslop-prose]       # breaks without it, so a missing one is an error
see_also: [technical-writing]  # a peer boundary, so it still works alone
```

Default to `see_also`. Use `requires` only when the artifact cannot function without the
other one. A hard dependency that points from a general artifact to a specific one stops
the general one from shipping alone.

Then create anything that does not exist yet, or cut the reference.

## Step 5. Record the triggers

For a skill, fill in `triggers.md` next to `SKILL.md`. It records prompts that must load
the skill and near-misses that must not.

Write the near-misses first. They are what stops a skill from firing on adjacent work,
and they force you to name which artifact owns the neighboring territory. Each one
should say what handles it instead.

Then type one of the "should fire" prompts yourself and confirm that the skill loads.
That is the only check that the description works, and no static check replaces it.

## Step 6. Register it

- **Rule.** Add a one-line entry under the right heading in `rules/RULES.md`. The detail
  file is read only on demand, so the line in `RULES.md` has to stand alone.
- **Skill, command, or agent.** Claude Code needs nothing, because the plugin manifest
  picks up the directory. For Codex and Cursor, a new skill needs a new symlink. Run the
  symlink step from the `thiamine-install` skill.

## Step 7. Validate

```sh
node scripts/validate.mjs
```

Errors must be zero. Read every warning, then either fix it or say why it is wrong.
Never report finishing with warnings you have not read.

Then check the one thing the validator cannot. Describe out loud the situation that
should trigger this artifact, and confirm that the description you wrote matches it.

## Do not

- Add a README, a CHANGELOG entry, or a summary of what you added. The artifact is the
  deliverable.
- Pad a template section you have nothing real to put in. Delete the section.
- Write a rule for something a linter already catches. Configure the linter, then name
  it in `enforced_by`.
