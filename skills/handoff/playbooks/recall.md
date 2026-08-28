### Recall

**Rebuild the working context, then hand back a brief.** For "catch me up", "what was I
working on", and resuming when no record was kept or the one that exists stopped being true.

Reconstruction is the expensive path. Before starting, check for a record: read
`<workspace>/.handoff-*.md`. If one exists, read it and go to step 5.

1. Classify first. A specific session to resume, with a branch and a worktree, is
   `branch-to-pr` and its `session-pickup` playbook. This is for loading context
   across several sessions before acting. If the user already stated where things stand,
   use that and skip the mining.

2. Lock the scope and say it back. The window, the topic, and the project. Default the
   window to the last week, and never quietly turn "everything" into "the recent few".
   Never read another project's transcripts without being asked.

   | Harness | Transcripts |
   | --- | --- |
   | Claude Code | `~/.claude/projects/<slug>/*.jsonl` |
   | Cursor | `~/.cursor/projects/<slug>/agent-transcripts/` |
   | Codex | `~/.codex/sessions/` |

   The slug is the project's absolute path with each separator turned into a dash. Order
   candidates by modification time rather than by name, since the names are opaque ids.

3. Delegate the mining. Transcripts are large and most of what they contain is not the
   answer, so the reading belongs in a subagent and only its findings come back. Ask for one
   block per session: the goal, the decisions, what is still open, what went wrong, and the
   artifacts, each citing the session it came from. For one or two sessions, read them
   directly.

4. Sweep what happened around the code, not only what you did to it. Where the topic names a
   feature or a file, its history lives in pull requests, commit messages, issues, and error
   tracking. A change with a long tail of follow-up fixes keeps most of its story there, and
   a transcript will not mention the revert that came a week later.

5. Verify against the repository. A transcript and a record are both history. Check the
   branches, the pull requests, and the working trees as they are now, and trust those where
   they disagree with the account.

6. Write the brief:

   - **Where it stands.** At most five bullets.
   - **Threads.** One line each, tagged with exactly one of `[merged #N]`, `[open PR #N]`,
     `[in flight <branch>]`, `[done, uncommitted]`, `[reverted #N]`, or `[not started]`. An
     untagged thread is unfinished, so tag it.
   - **Problems.** At most five, the ones that recur. Include anything that shipped and was
     reverted, so the next attempt starts where the last one stopped.
   - **Next move.** One concrete action.

7. Write the record you wished you had found. Reconstruction is expensive and its output is
   perishable, so put it in `<workspace>/.handoff-<branch>.md` before doing anything else.

**Reply:** the brief above. Cite each finding by the session or the pull request it came
from. Say what you could not determine, and say plainly when the record and the repository
disagreed.
