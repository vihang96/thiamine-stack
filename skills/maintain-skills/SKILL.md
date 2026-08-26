---
name: maintain-skills
description: "Runs a periodic pass over a repo's agent-facing context (rules, skills, AGENTS.md, CLAUDE.md) to find guidance that no longer matches the code, and routes each finding to a fix or a check. Use when asked to audit, refresh, or spring-clean the skills, when the feature map has outgrown what agents are told, when an agent followed stale guidance, or on a cadence after a batch of changes lands."
disable-model-invocation: true
owns: "whether the agent-facing context still describes the repo as it is now"
see_also: [thiamine-author, consistency, reflect]
---

# Maintain skills

Agent context is written once and read forever. Nothing fails when it goes stale: the file
still parses, the skill still loads, and the agent follows guidance for a repo that no
longer exists. The cost shows up as an agent confidently doing the wrong thing, which reads
like a model problem rather than a documentation problem.

This is the pass that catches that. It applies to any repo with agent-facing context, not
only to this one. In thiamine that is `rules/` and `skills/`. Elsewhere it is `AGENTS.md`,
`CLAUDE.md`, and whatever local skills the repo carries.

It runs in one direction only: claims out. `reflect` runs the other, taking knowledge from
finished sessions into new skills, agents, and rules. A finding here that the context never
captured something is a `reflect` job, so hand it over rather than writing the skill inline.

## When to run it

Cadence, not calendar. Run it when the ground has moved:

- A batch of artifacts landed, so the ones written first no longer know about the last.
- A dependency the context names changed: a tool, a harness, a directory layout, a CI job.
- An agent followed guidance that was wrong, and the guidance was the reason.
- Before you ask somebody else to install or rely on the context.

Do not run it on a schedule with nothing behind it. An audit with no changed ground finds
nothing and trains you to skim the next one.

## Procedure

### 1. Run the mechanical pass first

Never spend judgment on what a script already decides.

```sh
node scripts/validate.mjs        # in thiamine
```

Fix or explain every finding before going further. What survives is the part that needs a
reader. In another repo, run whatever that repo's linters and link checkers are, for the
same reason.

In a thiamine checkout a `PostToolUse` hook already runs this after every edit to an
artifact, and surfaces errors immediately. If that hook is installed, expect this step to be
clean and treat it as confirmation rather than as the pass. What it never checks is whether
a well-formed claim is true, which is the whole of what follows.

### 2. Fix the window

Audit what changed, not everything. The last audit is the boundary, and git already knows
where it is:

```sh
git log --oneline -1 --grep='maintain-skills'      # the last pass
git diff --stat <that commit>..HEAD            # ground that moved since
```

If there is no previous pass, take the last month, or the whole corpus if it is small.
Say which window you took.

Two sets come out of this: artifacts that changed in the window, and artifacts that did
not change but describe something that did. **The second set is where drift lives.** A file
nobody has touched in six months is the one most likely to be lying.

### 3. Check each drift class

Every finding needs the line and the fact that contradicts it. An impression is not a
finding.

| Class | What it looks like | How to confirm it |
| --- | --- | --- |
| Stale claim | Prose asserts something about a tool, path, or count that has since changed | Run the thing. `gh stack` existing turned "there is no stacking tool" into a lie. |
| Description drift | A skill grew capability its `description` never mentions, so it stops firing for the work it now handles | Read the body, then the description. List what the body does that the description does not name. |
| Ownership drift | Two artifacts now claim the same ground, or one still claims ground that moved | Grep both for the concept. Check `owns:` against what the body actually decides. |
| Vocabulary drift | Two names for one thing, introduced by separate edits | Grep the artifact name and its aliases across the corpus. Two spellings is the defect. |
| Orphaned advice | Guidance for a workflow, tool, or service nobody uses now | Look for a caller. Advice with no live situation is deleted, not updated. |
| Unverified claim | A number, an output, or a behaviour nobody has re-run since it was written | Re-run it. Fixture counts and command output are the usual suspects. |
| Feature-map gap | The repo does something real that the context never mentions, so every agent rediscovers it | Diff the directory tree and the entry points against what the context names. |

The last one is the only class that finds absence rather than error, so hunt it
deliberately. The others announce themselves once you look; a gap never does.

### 4. Route each finding

Sort before fixing. The routing is the decision; the edit is mechanical.

- **A check can decide it.** Write the check, not the prose. A number that drifted once
  will drift again, and a validator rule outlives the sentence you were about to correct.
  This is the default whenever the finding is mechanical.
- **Trivial edit**: a stale fact, a tightened line, one bullet. Do it directly.
- **Substantive edit**: a new section, a changed contract, a description rewrite. Hand it
  to `thiamine-author`, which owns shape and dependency declaration.
- **Delete it.** An artifact whose situation no longer occurs is removed. Deletion is a
  result, and an audit that never deletes is not looking hard enough.
- **Not drift.** Say so and move on. A finding you cannot evidence is dropped, not softened
  into a suggestion.

### 5. Present before applying

Show the findings and their routing, then wait. Do not apply edits from an audit
unprompted.

Context changes affect every future session in every repo the context reaches, so the blast
radius of a bad audit edit is larger than the blast radius of the drift it was fixing.

### 6. Land it

Commit with `maintain-skills` in the message, so the next pass can find this one and fix its
window from it. That sentence is the only state this skill keeps.

## Verify

- `node scripts/validate.mjs` reports no new findings.
- Every applied edit names the evidence that justified it.
- The window you audited is stated, along with what you did not cover.

An audit that reports "no drift found" has to say what it looked at. Without that it is
indistinguishable from an audit that did not run.

## Do not

- Rewrite for style. This pass is about truth, not prose. `unslop-prose` owns the other one.
- Audit the whole corpus every time. A pass too big to finish gets skimmed.
- Report a finding you did not confirm against the code.
- Fix a mechanical finding by hand twice. The second time, write the check.
