# Skill template

Copy one of the two shapes into `skills/<your-name>/SKILL.md`, then run
`node scripts/validate.mjs` before you consider it done.

## Pick a shape

**`procedure.SKILL.md`** — the skill *does* something. Steps, in order, with a
verification step at the end. Installing, migrating, debugging, releasing.

**`standard.SKILL.md`** — the skill *judges* something. Criteria, a worked example,
and a review checklist. Writing style, code review, API design.

The tell: if the sections would naturally be numbered and time-ordered, it is a
procedure. If they are groups of criteria that all apply at once, it is a standard.
Forcing a standard into "Procedure: 1, 2, 3" is the most common structural mistake
here, and it makes the skill unusable for review.

Both shapes are starting points. Delete sections you have nothing real to put in;
an empty heading is worse than a missing one.

## The description is the whole game

The agent sees only `name` + `description` when deciding whether to load the skill.
A description that says what the skill *is* gets ignored; one that says when to *use*
it gets invoked. Third person, and name the words a user would actually type.

Weak: `Cut AI tells from any writing. Must always apply.`
Strong: `Cuts AI tells from prose — filler, hedging, puffery, formatting artifacts.
Use when writing or editing docs, PR descriptions, commit messages, or any prose
that will be read by a person.`

The weak version has two defects the validator will flag: no trigger the agent can
recognize, and "must always apply" describes a rule, not a skill.

## Invocation: three settings, not two

| You want | Frontmatter | Reached by |
| --- | --- | --- |
| The agent loads it when relevant | *(default)* | agent's judgment, from `description` |
| Only you invoke it | `disable-model-invocation: true` | you typing `/skill-name` |
| It always applies | not a skill — see below | always in context |

There is no skill setting that means "always." Skill invocation is discretionary by
construction. If something must always apply, put a one-line entry in
`rules/RULES.md` and let that line route to the skill for the detail. The rule is the
trigger; the skill is the payload.

Setting `disable-model-invocation: true` while writing a description full of
"use when..." triggers promises behavior that cannot happen. Pick one.

## Dependencies

If your skill tells the agent to apply another skill, read a file, or use a slash
command, that thing has to exist. A missing dependency is the worst defect a skill
can have: the agent will not error, it will invent the missing contents and proceed.

Two fields, and the difference matters:

```yaml
requires: [unslop-prose]            # cannot work without it; missing one is an error
see_also: [technical-writing] # a peer boundary; this skill still works alone
```

Reach for `requires` only when the skill genuinely breaks without the other. A
lower-level skill naming a higher-level one is almost always `see_also` — otherwise
you have coupled the general thing to the specific thing, and it can no longer ship
on its own.

`scripts/validate.mjs` also catches undeclared references heuristically, so declaring
is optional and belongs to you rather than the harness. Harnesses ignore keys they
do not recognize.

## Overlap

Before adding a skill, read the siblings it sits next to. Two skills covering the
same ground and disagreeing is worse than either alone, because an agent can satisfy
the weaker one and call it done. The validator flags pairs of skills sharing several
identical examples.

Fix overlap with an `owns:` line and a `## Scope` section that names the sibling,
not by deleting one of them.

## Three habits worth copying

- **Cite sources with a fetch date.** `Source: diataxis.fr, fetched 2026-07-18.`
  Standards go stale silently; a date makes the staleness visible.
- **Include a worked example, before and after,** annotated with which criterion did
  what. It teaches the criteria interacting, which a list cannot.
- **End a standard with a review checklist.** It turns authoring guidance into
  something that can audit work that already exists.

## Trigger examples

Every skill gets a `triggers.md` next to its `SKILL.md`, recording prompts that must
load it and near-misses that must not. `scripts/new.mjs` scaffolds it for you.

This is the only record of what the description is *supposed* to match. Static checks
can confirm a description names triggers; they cannot confirm the agent loads the skill
when you type one. Until `claude plugin eval` is available, read the file and try the
prompts by hand.

Near-misses are the half people skip and the half that matters. A skill with no recorded
near-misses is untested against firing when it shouldn't, which is worse than not firing
at all: it burns context and applies the wrong criteria. Make them genuinely close, and
say which artifact should have handled each one instead.

## Before shipping

- [ ] `node scripts/validate.mjs` reports no errors for your skill
- [ ] You read the warnings and either fixed them or can say why they are wrong
- [ ] Every skill, file, and command you reference exists
- [ ] Nothing in SKILL.md that only matters in a rare branch (move it to `references/`)
- [ ] `triggers.md` has real prompts in both sections, including near-misses
- [ ] You typed one of the "should fire" prompts and the skill actually loaded
- [ ] You have run through the skill yourself once, on real work
