# Install

Two paths. Use the first unless you are editing the stack itself.

## Install from GitHub

### Claude Code

Run these inside Claude Code:

```
/plugin marketplace add vihang96/thiamine-stack
/plugin install thiamine@thiamine-stack
```

This needs no clone and works the same on any machine. It delivers the skills, agents,
and commands. It does not make `rules/RULES.md` always-on, which is the next section.

To update later, run `/plugin marketplace update thiamine-stack`.

### Codex and Cursor

Neither installs a plugin from GitHub, so clone once and link the skills in.

`~/.cursor/skills-cursor/` and `~/.codex/skills/.system/` are **harness-managed**. If you
write into them, the harness overwrites your links on its next update. Use the
user-owned `skills` directory instead, which is what the commands below do.

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

## Wire up the always-on rules

`rules/RULES.md` is the always-on standard. Each harness needs it wired in once.

Claude Code supports imports. To add one, append a line to `~/.claude/CLAUDE.md`, and
create that file if it does not exist. If you installed from GitHub, the marketplace
clone holds the rules:

```sh
echo "@$HOME/.claude/plugins/marketplaces/thiamine-stack/rules/RULES.md" >> ~/.claude/CLAUDE.md
```

That path is Claude Code's own layout rather than a documented interface, so it can move
on an update. If you would rather not depend on it, clone the repo as above and point the
import at your own checkout.

Codex and Cursor read `AGENTS.md` and have no import syntax, so symlink from a clone:

```sh
ln -sfn "$THIAMINE/rules/RULES.md" ~/.codex/AGENTS.md
ln -sfn "$THIAMINE/rules/RULES.md" ~/.cursor/AGENTS.md
```

If a target already exists as a real file with content, do not overwrite it. Merge that
content into `rules/RULES.md` first.

## Install from a local checkout

Use this when you are editing the stack, because your changes take effect without a push
and a marketplace update.

Two marketplaces offering the same plugin name is ambiguous. If you already added the
GitHub one, remove it first:

```sh
claude plugin marketplace remove thiamine-stack
```

Then point the marketplace at your checkout:

```
/plugin marketplace add /absolute/path/to/thiamine-stack
/plugin install thiamine@thiamine-stack
```

Everything else matches the sections above, with `$THIAMINE` set to your checkout.

### Which copy is actually loaded

A directory marketplace loads the plugin **live from your checkout**. An edit to a skill,
a rule, or a hook takes effect on the next session with no update step.

Claude Code also writes a snapshot of the plugin under
`~/.claude/plugins/cache/thiamine-stack/thiamine/<version>/` at install time, and records
it as `installPath`. That copy is not what runs. It goes stale the moment you commit, and
reading it is the easiest way to debug the wrong file. The path that runs is the
marketplace install location, which the plugin's own hooks receive as
`$CLAUDE_PLUGIN_ROOT`.

`claude plugin list` does not print either path, so check it directly:

```sh
jq -r '."thiamine-stack".installLocation' ~/.claude/plugins/known_marketplaces.json
```

Like the marketplace path above, that file is Claude Code's own layout rather than a
documented interface, so treat a change in it as expected rather than broken.

## Add any other harness

Every harness reads some always-on instruction file. Point it at `rules/RULES.md`, and
symlink where there is no import syntax. That is the whole integration, because the rules
are plain markdown with no harness-specific syntax.

## Verify the install

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
