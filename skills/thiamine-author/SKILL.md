---
name: thiamine-author
description: Authors a new thiamine skill, agent, command, or rule from the repo templates, picking the right artifact type and shape and validating it before finishing. Use when adding to the thiamine stack, when asked to "add a skill/rule/command" for engineering standards, or when a recurring correction should become a permanent standard.
requires: [thiamine-install]
---

# Author a thiamine artifact

## Step 1 — Pick the artifact type

The distinction is **who decides to invoke it**. Get this right first; the wrong type
is the most common defect in a standards repo.

| Artifact | Who invokes it | Right when |
| --- | --- | --- |
| Rule (`rules/RULES.md`) | nobody, always loaded | it applies to essentially all work |
| Rule detail (`rules/<id>.md`) | agent, on demand | the rationale is long but the rule is one line |
| Skill | agent, from the description | "when X happens, do Y", X being recognizable |
| Skill + `disable-model-invocation: true` | you, typing `/name` | long content you want on demand only |
| Command | you, typing `/name` | a short procedure you trigger by name |
| Agent | delegated, isolated context | read-heavy work with a small output |

Two questions resolve most cases:

- Does it apply to a *subset* of work — a language, a file type, a phase? Then it is a
  skill, not a rule, even if it feels fundamental.
- Would you be annoyed if it fired unprompted? Then a command, or a skill with model
  invocation disabled.

**"It must always apply" is not a skill.** Skill invocation is discretionary, so a
skill whose description claims to always apply will fire unpredictably. Split it: a
one-line entry in `rules/RULES.md` cheap enough to stay loaded forever, plus a skill
holding the detail the line routes to. The rule is the trigger; the skill is the payload.

If the request is ambiguous, state which type you picked and why in one sentence
before writing. Do not ask unless the choice changes the content materially.

## Step 2 — Check the territory is free

Read `rules/RULES.md` and list `skills/`, `commands/`, `agents/`. Then read any
sibling whose subject touches yours.

A near-duplicate is worse than nothing: two artifacts covering the same ground and
disagreeing let an agent satisfy the weaker one and report done. If something close
exists, either extend it, or add an `owns:` line and a `## Scope` section to both
naming which is authoritative where. Say which you did.

## Step 3 — Pick the shape, then write it

For skills there are two shapes, and using the wrong one makes the skill unusable:

- **`templates/skill/procedure.SKILL.md`** — the skill *does* something. Ordered steps,
  ending in verification.
- **`templates/skill/standard.SKILL.md`** — the skill *judges* something. Criteria that
  all apply at once, a worked example, a review checklist.

The tell: if the sections would naturally be numbered and time-ordered, it is a
procedure. If they are groups of criteria, it is a standard. Do not force a standard
into "Procedure: 1, 2, 3".

Scaffold it, which copies the template, substitutes the name, links new skills into the
other installed harnesses, and validates:

```sh
node scripts/new.mjs skill <name> --standard   # or --procedure
node scripts/new.mjs rule <id>
node scripts/new.mjs command <name>
node scripts/new.mjs agent <name>
```

Then read the template's `README.md` before filling it in — it names the failure modes
for that artifact type. Delete any section you have nothing real to put in; the
validator flags placeholders you leave behind.

The one thing that matters most, by type:

- **Skill** — the `description`. It is the only text the agent sees when deciding to
  load the skill. Third person, and it must name recognizable triggers.
- **Rule** — the "failure it prevents" section, with a vivid concrete cost.
- **Agent** — the return contract and the disposition ("try to refute this", not
  "review this").
- **Command** — the stop conditions.

## Step 4 — Declare dependencies

If the artifact tells the agent to apply another skill, read a file, or use a slash
command, that thing must exist. This is the worst defect an artifact can have: the
agent does not error on a missing dependency, it invents the contents and proceeds.

Declare every one, choosing the field by whether the artifact works without it:

```yaml
requires: [unslop-prose]            # breaks without it; a missing one is an error
see_also: [technical-writing] # a peer boundary; still works alone
```

Default to `see_also`. Use `requires` only when the artifact genuinely cannot function
without the other, because a hard dependency pointing from a general artifact to a
specific one stops the general one from shipping alone.

Then create anything that does not exist yet, or cut the reference.

## Step 5 — Record its triggers

For a skill, fill in `triggers.md` next to `SKILL.md`. It records prompts that must load
the skill and near-misses that must not.

Write the near-misses first. They are what stops a skill from firing on adjacent work,
and they force you to name which artifact owns the neighbouring territory. Each one
should say what handles it instead.

Then type one of the "should fire" prompts yourself and confirm the skill loads. That is
the only check that the description works, and no static check substitutes for it.

## Step 6 — Register it

- **Rule**: add a one-line entry under the right heading in `rules/RULES.md`. The detail
  file is only read on demand, so the line in `RULES.md` must stand alone.
- **Skill / command / agent**: nothing to do for Claude Code — the plugin manifest picks
  up the directory. For Codex and Cursor, a *new skill* needs a new symlink; run the
  symlink step from the `thiamine-install` skill.

## Step 7 — Validate

```sh
node scripts/validate.mjs
```

Errors must be zero. Read every warning and either fix it or state why it is wrong —
do not report finishing with warnings you have not looked at.

Then check the one thing the validator cannot: describe out loud the situation that
should trigger this artifact, and confirm the description you wrote would actually
match it.

## Do not

- Add a README, CHANGELOG entry, or summary of what you added. The artifact is the
  deliverable.
- Pad a template section you have nothing real to put in. Delete the section.
- Write a rule for something a linter already catches. Configure the linter and name
  it in `enforced_by`.
