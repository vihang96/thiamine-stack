# Install

Two paths. Use the first unless you are editing the stack itself.

## From GitHub

### Claude Code

Run these inside Claude Code:

```
/plugin marketplace add vihang96/thiamine-stack
/plugin install thiamine@thiamine-stack
```

No clone, nothing to keep in sync, and it works the same on any machine. This delivers
the skills, agents, and commands. It does not make `rules/RULES.md` always-on, which is
the Rules section below.

Update later with `/plugin marketplace update thiamine-stack`.

### Codex and Cursor

Neither installs a plugin from GitHub, so clone once and link the skills in:

```sh
git clone https://github.com/vihang96/thiamine-stack.git ~/.thiamine-stack
THIAMINE=~/.thiamine-stack

for dir in ~/.codex/skills ~/.cursor/skills; do
  [ -d "$(dirname "$dir")" ] || continue
  mkdir -p "$dir"
  for s in "$THIAMINE"/skills/*/; do
    ln -sfn "$s" "$dir/$(basename "$s")"
  done
done
```

`~/.cursor/skills-cursor/` and `~/.codex/skills/.system/` are **harness-managed**. Do not
write into them; they are overwritten on update.

## Rules

`rules/RULES.md` is the always-on standard. Each harness needs it wired in once.

**Claude Code** supports imports, so append a line to `~/.claude/CLAUDE.md`, creating the
file if it does not exist. If you installed from GitHub, the marketplace clone holds the
rules:

```sh
echo "@$HOME/.claude/plugins/marketplaces/thiamine-stack/rules/RULES.md" >> ~/.claude/CLAUDE.md
```

That path is Claude Code's own layout rather than a documented interface, so it could
move. If you would rather not depend on it, clone the repo as above and point the import
at your own checkout instead.

**Codex and Cursor** read `AGENTS.md` and have no import syntax, so symlink from a clone:

```sh
ln -sfn "$THIAMINE/rules/RULES.md" ~/.codex/AGENTS.md
ln -sfn "$THIAMINE/rules/RULES.md" ~/.cursor/AGENTS.md
```

If the target already exists as a real file with content, do not overwrite it. Merge that
content into `rules/RULES.md` first.

## From a local checkout

Use this when you are editing the stack, so your changes take effect without a push and
a marketplace update.

```
/plugin marketplace add /absolute/path/to/thiamine-stack
/plugin install thiamine@thiamine-stack
```

Everything else matches the sections above, with `$THIAMINE` set to your checkout.
Remove the GitHub marketplace first if you have both, since two marketplaces offering the
same plugin name is ambiguous:

```sh
claude plugin marketplace remove thiamine-stack
```

## Any other harness

Every harness reads some always-on instruction file. Point it at `rules/RULES.md`, by
symlink where there is no import syntax. That is the whole integration. The rules are
plain markdown with no harness-specific syntax.

## Verify

```sh
claude plugin list | grep thiamine
ls -la ~/.codex/skills ~/.cursor/skills 2>/dev/null
readlink ~/.codex/AGENTS.md
```

Every thiamine entry should resolve, and no link should dangle.

## Uninstall

```sh
claude plugin uninstall thiamine@thiamine-stack
claude plugin marketplace remove thiamine-stack
```

Then delete the symlinks and remove the `@` import line from `~/.claude/CLAUDE.md`.
Nothing is written anywhere else.
