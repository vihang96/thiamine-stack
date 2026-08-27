### Declare and discover

**Say what you are about to work on, and read what everyone else said, before writing
anything.** For starting a unit of work in a workspace where other sessions may be active.

1. Look first. Three sources, and skipping any of them leaves a class of collision
   invisible:

   ```sh
   sh scripts/lanes.sh <workspace-root>        # what other sessions announced
   git -C <repo> fetch origin                  # so other machines' branches are visible
   git -C <repo> branch -r --sort=-committerdate | head
   ```

   Add the audit from `multi-repo-mechanics` for what exists on disk. A worktree with no
   board entry is normal and means somebody worked without announcing, which is the case
   the fetch and the audit exist to cover.

2. Write your entry on the same board the readers scan. That is the workspace holding the
   sibling repos, not the repo you are standing in. Two boards with one of them scanned is
   the failure here, and it is silent: your entry exists, and every check misses it.

   ```sh
   # Derive the root rather than typing it. --git-common-dir resolves to the main
   # checkout's .git even from a linked worktree, which is where lanes usually run.
   repo=$(dirname "$(cd "$(git rev-parse --git-common-dir)" && pwd)")
   root=$(dirname "$repo")
   now=$(date -u +%Y-%m-%dT%H:%M:%SZ)

   # The unit, not the branch. They are the same thing only where each change gets its own
   # branch. Name it yourself where they are not.
   unit="feat/retention"
   slug=$(printf '%s' "$unit" | tr '/ ' '--')

   mkdir -p "$root/.thiamine/lanes"
   ( set -C; cat > "$root/.thiamine/lanes/$slug" ) <<ENTRY
   unit: $unit
   goal: let an admin set how long exception data is kept, per workspace
   repos: orders, orders-schema
   paths: src/retention/**, migrations/**
   decides: how a retention policy is represented in the API
   session: $(basename "${SHELL:-shell}") pid $$ on $(hostname -s)
   started: $now
   heartbeat: $now
   ENTRY
   ```

   `mkdir -p` matters: the first announcement in a workspace has no board to write into,
   and `set -C` alone fails there rather than creating one.

   `set -C` refuses to overwrite an entry that already exists. When it refuses, read the
   entry. Either another session is on this unit, or it is yours from a previous session,
   or your slug does not identify your unit, and those need three different responses.

   That third case is the one to watch in a repo that commits straight to its default
   branch. Deriving the slug from the branch gives every session `main`, so the second
   announcement is refused and reads as a collision when it is only a naming clash. Where
   the branch does not identify the work, name the unit after the work.

   Where the repo has no sibling repos, put the board at the repo root instead. Which
   directory does not matter. Every session in the group using the same one does, so pass
   that path to `scripts/lanes.sh` as well.

3. Fill `decides` even when it feels obvious. It is the field that prevents the expensive
   collision, because two sessions overlapping on files produce a merge conflict somebody
   notices, and two sessions answering one design question differently produce two shipped
   answers nobody notices. `paths` can be approximate. `decides` should not be.

4. Keep the heartbeat current. Update it when you would naturally pause: after a commit,
   after a checkpoint, before a long build. It exists so another session can tell a live
   unit from an abandoned one, and an entry nobody refreshes reads as dead work.

5. Add `waiting-on` only if you are waiting. That turns the entry into a queued unit and
   `playbooks/wait-for-a-predicate.md` owns what goes in it.

6. Retire the entry when the work lands, together with the branch and the handoff record.
   `handoff` owns the record; this is the announcement, and both die with the change.

**Reply:** what is already in flight and who owns it, your entry's path, and the route you
are taking from the table in the skill. One or two lines. This is a step before the work,
not a report.
