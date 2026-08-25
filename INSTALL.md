# Install

Thiamine installs by **symlink**. The repo is the source of truth; harnesses point at
it. Edit a rule here and every harness sees the change immediately — there is no sync
step and no generated files.

## The short version

Open any agent in this directory and say:

```
use the thiamine-install skill
```

It detects which harnesses you have, wires up the ones that are present, and verifies
the result. That is the recommended path — it handles the cases below plus the
harness-managed directories you should not write into.

## By hand

Set `THIAMINE` to this checkout:

```sh
THIAMINE="$(pwd)"
```

### Claude Code

Native plugin support — use it. Run these inside Claude Code:

```
/plugin marketplace add <absolute path to this repo>
/plugin install thiamine@thiamine-stack
```

Then make the rules always-on by appending an import to `~/.claude/CLAUDE.md`
(create the file if it does not exist):

```sh
echo "@$THIAMINE/rules/RULES.md" >> ~/.claude/CLAUDE.md
```

### Codex

```sh
mkdir -p ~/.codex/skills
for s in "$THIAMINE"/skills/*/; do
  ln -sfn "$s" ~/.codex/skills/"$(basename "$s")"
done
ln -sfn "$THIAMINE/rules/RULES.md" ~/.codex/AGENTS.md
```

### Cursor

```sh
mkdir -p ~/.cursor/skills
for s in "$THIAMINE"/skills/*/; do
  ln -sfn "$s" ~/.cursor/skills/"$(basename "$s")"
done
ln -sfn "$THIAMINE/rules/RULES.md" ~/.cursor/AGENTS.md
```

`~/.cursor/skills-cursor/` and `~/.codex/skills/.system/` are **harness-managed**.
Do not write into them; they get overwritten on update.

### Any other harness

Every harness reads some always-on instruction file. Point it at
`$THIAMINE/rules/RULES.md`, by symlink if the harness has no import syntax. That is
the entire integration; the rules are plain markdown with no harness-specific syntax.

## Verify

```sh
ls -la ~/.codex/skills ~/.cursor/skills 2>/dev/null
readlink ~/.codex/AGENTS.md
grep -n thiamine ~/.claude/settings.json
```

Every thiamine entry should resolve into this repo, and no link should dangle.

## Uninstall

Delete the symlinks, remove the `@` line from `~/.claude/CLAUDE.md`, and
`/plugin uninstall thiamine@thiamine-stack`. Nothing is written anywhere else.
