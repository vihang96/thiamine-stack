---
name: thiamine-install
description: Installs or updates the thiamine engineering standards across coding harnesses (Claude Code, Codex, Cursor) by symlinking skills and wiring the rules file into each harness's global instructions. Use when setting up thiamine on a new machine, adding a harness, wiring thiamine into a specific repo, or when a harness is not picking up thiamine skills or rules.
---

# Install thiamine

Install thiamine by **symlink, never by copy**. The repo is the single source of truth,
and every harness points at it. Editing a rule or skill in the repo takes effect
everywhere at once, with no sync step.

Do not create copies of `rules/` or `skills/` anywhere. If you find copies from an
earlier install, replace them with symlinks and say so.

## Step 1. Pick the source

Ask the user which they want, unless it is obvious:

- **From GitHub** (`vihang96/thiamine-stack`), for a machine that only consumes the
  standards. This needs no clone and nothing to keep in sync.
- **From a local checkout**, when the user edits the stack. Changes take effect without
  a push and a marketplace update.

For a local checkout, find it and store the absolute path as `$THIAMINE`. Confirm that
`$THIAMINE/rules/RULES.md` and `$THIAMINE/.claude-plugin/plugin.json` exist before you
continue. If they do not, you are in the wrong directory. Stop and ask.

Codex and Cursor always need a clone, because neither installs a plugin from GitHub. If
the user picked GitHub and also runs one of those, clone to `~/.thiamine-stack` and use
it as `$THIAMINE` for those two harnesses.

## Step 2. Detect which harnesses are present

Check which of these exist, and install only for the ones you find:

| Harness | Global skills dir | Global instructions |
| --- | --- | --- |
| Claude Code | `~/.claude/skills/` | `~/.claude/CLAUDE.md` |
| Codex | `~/.codex/skills/` | `~/.codex/AGENTS.md` |
| Cursor | `~/.cursor/skills/` | `~/.cursor/AGENTS.md` |

Report what you found. Confirm the list with the user before you write anything.

**Do not write into a harness-managed directory.** A skills directory that holds a
marker or manifest file belongs to the harness. `.codex-system-skills.marker` and
`.cursor-managed-skills-manifest.json` are two such files. Use the sibling user-owned
directory instead, and create it if it does not exist. If you cannot tell who owns a
directory, ask. The harness overwrites a link in its own directory on the next update,
and the user never sees it happen.

## Step 3. Install the Claude Code plugin

Claude Code supports plugins, so use that rather than symlinking each skill.

Register the marketplace and install the plugin. From GitHub:

```
/plugin marketplace add vihang96/thiamine-stack
/plugin install thiamine@thiamine-stack
```

From a local checkout, substitute the path:

```
/plugin marketplace add <absolute path to $THIAMINE>
/plugin install thiamine@thiamine-stack
```

Two marketplaces offering the same plugin name is ambiguous, so add only one. To switch,
run `claude plugin marketplace remove thiamine-stack` first.

Both are interactive slash commands, so the user has to run them. Print them, ask the
user to run them, then confirm that `thiamine` appears under `enabledPlugins` in
`~/.claude/settings.json`.

This picks up `skills/`, `agents/`, and `commands/` on its own. It does not deliver
`rules/RULES.md`. Step 5 does that.

## Step 4. Link the skills for Codex and Cursor

For each harness you found, symlink each skill directory on its own. One link per skill
means a new skill needs one new link, and a harness can drop a single skill by deleting
one link.

```sh
for s in "$THIAMINE"/skills/*/; do
  ln -sfn "$s" "<harness skills dir>/$(basename "$s")"
done
```

Run `ls -la` on the target directory to verify. Every thiamine entry should resolve into
`$THIAMINE` as a symlink.

## Step 5. Wire up the rules

`rules/RULES.md` has to reach every harness as always-on instructions.

**Claude Code** supports imports. Append a line to `~/.claude/CLAUDE.md`, and create that
file if it is absent rather than replacing it.

With a local checkout, point at the checkout:

```
@$THIAMINE/rules/RULES.md
```

With a GitHub install and no checkout, the marketplace clone holds the rules:

```
@$HOME/.claude/plugins/marketplaces/thiamine-stack/rules/RULES.md
```

Tell the user that the second path is Claude Code's own layout rather than a documented
interface, so it can move on an update. Offer the clone as the durable alternative.

**Codex and Cursor** read `AGENTS.md` and have no import syntax, so symlink instead:

```sh
ln -sfn "$THIAMINE/rules/RULES.md" ~/.codex/AGENTS.md
```

If a target already exists as a real file with content, do not overwrite it. Show the
user what is there. Ask whether to merge that content into `$THIAMINE/rules/RULES.md` or
to leave the harness alone.

## Step 6. Verify, then report what you checked

The install is not complete until you check it:

- Run `ls -la` on each target. Every link resolves, and none dangle.
- Run `readlink` on two of them. Confirm the paths point into `$THIAMINE`.
- For Claude Code, confirm the plugin appears in `enabledPlugins`.

Report one line per harness: installed, skipped and why, or failed and how. Never report
success for a harness you did not verify.

## Rules for one project

Thiamine is installed globally, so anything in it applies to every repo the user opens. A
rule that names a module, a path, or a function belongs to one repo and must not go in.
Told globally to use a helper that exists in one project, an agent will look for it
everywhere and invent it where it is missing.

Project rules go in that repo's own `AGENTS.md`, or `CLAUDE.md` for Claude Code. Both load
alongside the global file rather than replacing it, so the two compose:

| Scope | File | Holds |
| --- | --- | --- |
| Global | `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md` | thiamine, portable across repos |
| Project | `<repo>/AGENTS.md` | module names, paths, directory layout, local conventions |

The test for which file a rule belongs in: could another repo follow it? "Parallelise
independent awaits" travels. "Parse resource names with `myapp.util.parse_name`" does not.

When the user offers a rule naming something in their codebase, say which of the two files
it belongs in rather than adding it to the stack.

## Vendor the rules into one repo

Sometimes the rules have to live inside a specific repo, so that CI or a collaborator
sees them too. In that case, **copy** `rules/RULES.md` into the repo as a real file and
commit it. Do not symlink. A symlink that points outside the repo breaks for everyone
who clones it.

Say plainly that the copy will drift from the source, and that the repo now owns it.

## Uninstall

Run `/plugin uninstall thiamine@thiamine-stack`. Delete the symlinks. Remove the `@`
import line from `~/.claude/CLAUDE.md`. Nothing is written anywhere else.
