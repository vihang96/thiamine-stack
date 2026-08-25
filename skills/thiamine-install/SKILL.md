---
name: thiamine-install
description: Installs or updates the thiamine engineering standards across coding harnesses (Claude Code, Codex, Cursor) by symlinking skills and wiring the rules file into each harness's global instructions. Use when setting up thiamine on a new machine, adding a harness, wiring thiamine into a specific repo, or when a harness is not picking up thiamine skills or rules.
---

# Install thiamine

Thiamine is installed by **symlink, never by copy**. The repo is the single source of
truth; every harness points at it. Editing a rule or skill in the repo takes effect
everywhere immediately, with no sync step.

Do not create copies of `rules/` or `skills/` anywhere. If you find copies from an
earlier install, replace them with symlinks and say so.

## Step 1 — Pick the source

Ask which the user wants, unless it is obvious:

- **From GitHub** (`vihang96/thiamine-stack`) for a machine that only consumes the
  standards. No clone, nothing to keep in sync.
- **From a local checkout** when the user edits the stack, so changes take effect
  without a push and a marketplace update.

For a local checkout, find it, store the absolute path as `$THIAMINE`, and confirm
`$THIAMINE/rules/RULES.md` and `$THIAMINE/.claude-plugin/plugin.json` exist before
continuing. If they do not, you are in the wrong directory. Stop and ask.

Codex and Cursor always need a clone, since neither installs a plugin from GitHub. If
the user picked GitHub and also runs one of those, clone to `~/.thiamine-stack` and use
it as `$THIAMINE` for those harnesses.

## Step 2 — Detect which harnesses to wire up

Check which of these exist. Only install for harnesses that are actually present:

| Harness | Global skills dir | Global instructions |
| --- | --- | --- |
| Claude Code | `~/.claude/skills/` | `~/.claude/CLAUDE.md` |
| Codex | `~/.codex/skills/` | `~/.codex/AGENTS.md` |
| Cursor | `~/.cursor/skills/` | `~/.cursor/AGENTS.md` |

Report what you found, then confirm the list with the user before writing anything.

**Do not write into a harness-managed directory.** If a skills dir contains a marker
or manifest file (`.codex-system-skills.marker`, `.cursor-managed-skills-manifest.json`,
or similar), that directory belongs to the harness. Use the sibling user-owned dir
instead, creating it if needed. When unsure whether a dir is user-owned, ask rather
than guess — a bad write here can be silently clobbered on the harness's next update.

## Step 3 — Claude Code

Claude Code has native plugin support, so use it rather than symlinking skills
individually.

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

Do not add both. Two marketplaces offering the same plugin name is ambiguous; remove one
with `claude plugin marketplace remove thiamine-stack` before adding the other.

These are interactive slash commands — the user must run them. Print them and ask the
user to run them, then verify by checking that `thiamine` appears under
`enabledPlugins` in `~/.claude/settings.json`.

This picks up `skills/`, `agents/`, and `commands/` automatically. It does **not**
deliver `rules/RULES.md` — that happens in step 5.

## Step 4 — Codex and Cursor

For each present harness, symlink each skill directory individually. Per-skill links
mean a new skill needs one new link, and a harness can opt out of a skill by deleting
one link.

```sh
for s in "$THIAMINE"/skills/*/; do
  ln -sfn "$s" "<harness skills dir>/$(basename "$s")"
done
```

Verify with `ls -la` on the target dir — every thiamine entry should show as a symlink
resolving into `$THIAMINE`.

## Step 5 — Wire up the rules

`rules/RULES.md` must reach every harness as always-on instructions.

**Claude Code** supports imports, so append a line to `~/.claude/CLAUDE.md`, creating it
if absent rather than replacing it.

With a local checkout, point at the checkout:

```
@$THIAMINE/rules/RULES.md
```

With a GitHub install and no checkout, the marketplace clone holds the rules:

```
@$HOME/.claude/plugins/marketplaces/thiamine-stack/rules/RULES.md
```

Tell the user that second path is Claude Code's own layout rather than a documented
interface, so it could move on an update. Offer the clone as the durable alternative.

**Codex and Cursor** read `AGENTS.md` and have no import mechanism. Symlink instead:

```sh
ln -sfn "$THIAMINE/rules/RULES.md" ~/.codex/AGENTS.md
```

If the target already exists and is a real file with content, do not overwrite it.
Show the user the existing content and ask whether to merge it into
`$THIAMINE/rules/RULES.md` or leave that harness alone.

## Step 6 — Verify, and say what you verified

Installation is not complete until checked:

- `ls -la` each target — every link resolves, none dangle
- `readlink` a couple of them and confirm the paths point into `$THIAMINE`
- For Claude Code, confirm the plugin is in `enabledPlugins`

Report per harness: installed, skipped (and why), or failed (and how). Do not report
success for a harness you did not verify.

## Per-repo install

Occasionally the rules need to live in a specific repo — so CI or a collaborator
sees them, not just you. In that case, **copy** `rules/RULES.md` into the repo as a
real file (not a symlink; symlinks out of a repo break for everyone else) and commit it.
Say explicitly that this copy will drift from the source and is now that repo's own.

## Uninstall

Remove the symlinks, remove the `@` import line from `~/.claude/CLAUDE.md`, and run
`/plugin uninstall thiamine@thiamine-stack`. Nothing else is written anywhere.
