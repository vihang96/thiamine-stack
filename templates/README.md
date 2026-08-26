# Templates

Pick by what you are trying to change about the agent's behavior:

A skill can carry `references/` for detail, `playbooks/` for procedures with a reply
contract, and `scripts/` for the mechanical steps. See `skill/README.md` for which is
which.

| You want to... | Use | Lives in |
| --- | --- | --- |
| Give the agent a repeatable procedure for when a situation arises | `skill/procedure.SKILL.md` | `skills/<name>/` |
| Give the agent criteria for judging or reviewing something | `skill/standard.SKILL.md` | `skills/<name>/` |
| Delegate read-heavy work to an isolated context | `agent/` | `agents/<name>.md` |
| Give yourself a `/shortcut` you invoke deliberately | `command/` | `commands/<name>.md` |
| Add a standard that applies to all code, always | `rule/` | `rules/why/<id>.md` + a line in `rules/RULES.md` |

Scaffold with `node scripts/new.mjs <type> <name>` rather than copying by hand, and run
`node scripts/validate.mjs` before calling it done.

## Who decides to invoke it

That is the real distinction between the artifact types, and there are five settings,
not four:

| Artifact | Who invokes it | Context cost |
| --- | --- | --- |
| **Rule** (`rules/RULES.md`) | nobody, always loaded | every request, forever |
| **Rule detail** (`rules/why/<id>.md`) | agent, on demand | only when read |
| **Skill** | the agent, from the description | only when it fires |
| **Skill**, `disable-model-invocation: true` | you, by typing `/name` | only when you ask |
| **Command** | you, by typing `/name` | only when you ask |

Two questions resolve most cases:

- Does it apply to a subset of work, such as one language, one file type, or one phase?
  Then it is a skill rather than a rule, even if it feels fundamental.
- Would you be annoyed if it fired unprompted? Then either a command, or a skill with
  `disable-model-invocation: true`. Prefer the skill when the content is long or has
  references. Prefer the command when it is a short procedure you trigger by name.

## The thing that has no artifact type

"This must always apply" is not a skill. Skill invocation is discretionary by
construction, so a skill whose description says "always" will fire unpredictably.

Long always-on content splits in two: a one-line entry in `rules/RULES.md` that is
cheap enough to keep loaded forever, and a skill holding the detail that the line
routes to. The rule is the trigger. The skill is the payload.

## Two artifacts, one territory

The failure mode that costs the most is two artifacts covering the same ground and
disagreeing, because an agent can satisfy the weaker one and report done. It happens
most between a broad standard and a narrow one written later.

Prevent it with an `owns:` line in the frontmatter and a `## Scope` section naming
the sibling artifact. `scripts/validate.mjs` flags pairs that share several identical
examples, which is the cheapest available signal that two artifacts have merged. It
stops flagging them once both sides declare `owns:` and link to each other, since
overlap is only a defect while it is undeclared.

Link peers with `see_also:`, not `requires:`. `requires:` means the artifact does not
work without the other one. That is rarely true of a boundary between equals, and it
makes the more general artifact unusable on its own.

Scoping beats deleting. A standard that says "applies to prose, and `reference` mode
overrides the voice rules here" is more useful than either artifact alone.

## Adding one

```
use the thiamine-author skill to add a skill that ...
```

It picks the type and shape, scaffolds it with `scripts/new.mjs`, registers it, and runs
the validator. Or do it yourself:

```sh
node scripts/new.mjs skill my-thing --standard
```

Copying a template by hand still works. Nothing here requires the scripts, and both
scripts run standalone on Node with no dependencies.
