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

## Step 1 — Locate the repo

Find the thiamine-stack checkout. Ask the user if it is not obvious from the working
directory. Store the absolute path; every step below needs it. Call it `$THIAMINE`.

Confirm `$THIAMINE/rules/RULES.md` and `$THIAMINE/.claude-plugin/plugin.json` exist
before continuing. If not, you are in the wrong directory — stop and ask.

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

Register the repo as a local marketplace and install the plugin:

```
/plugin marketplace add <absolute path to $THIAMINE>
/plugin install thiamine@thiamine-stack
```

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

**Claude Code** supports imports, so append a line to `~/.claude/CLAUDE.md`
(create it if absent) rather than replacing the file:

```
@$THIAMINE/rules/RULES.md
```

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
