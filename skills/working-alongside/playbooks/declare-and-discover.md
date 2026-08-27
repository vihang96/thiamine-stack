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

2. Write your entry at `<workspace>/.thiamine/lanes/<branch-with-dashes>`. Create it with
   `set -C` so a second session cannot silently overwrite one:

   ```sh
   ( set -C; cat > "$root/.thiamine/lanes/$slug" ) <<'ENTRY'
   unit: feat/retention
   goal: let an admin set how long exception data is kept, per workspace
   repos: orders, orders-schema
   paths: src/retention/**, migrations/**
   decides: how a retention policy is represented in the API
   session: claude-code pid 48213 on mbp
   started: 2026-08-26T09:02:00Z
   heartbeat: 2026-08-26T09:02:00Z
   ENTRY
   ```

   If it already exists, read it. Either another session is on this unit, or it is yours
   from a previous session, and those need opposite responses.

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
