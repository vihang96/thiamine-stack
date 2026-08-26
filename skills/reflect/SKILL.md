---
name: reflect
description: "Mines a finished session, or several, for what was learned the hard way and encapsulates it as a skill, agent definition, rule, or check so the next agent does not rediscover it. Use when asked to reflect on a session, to capture what a long build taught, to make a hard-won approach repeatable, or to pull recent sessions on a repo into the stack."
disable-model-invocation: true
owns: "turning what a session figured out into a repeatable capability"
see_also: [thiamine-author, handoff, continual-learning, working-style, drift-audit]
---

# Reflect

A long session ends having figured things out: the approach that worked after three that
did not, the flag that turns a useless command into a useful one, the assumption that held
for an hour before the code contradicted it. None of that survives the session. The next
agent starts from the same place and pays the same cost.

This pass turns that into something loadable. The test of a good reflection is not that it
recorded what happened. It is that the same work, attempted again next month, is boring.

## Scope

A harness has four things that learn, and they do not update the same way:

| | Memory | Skills, agents, rules |
| --- | --- | --- |
| Belongs to | the harness | the user |
| Lives in | the harness's own store, per machine | a repo, versioned and reviewed |
| Owned by | `continual-learning` | this skill |
| Holds | who the user is, what the project is | how the work gets done |
| Bar to write | stated once | recurred, across sessions or repos |
| When | continuously, as facts accumulate | after a body of work lands and the method is proven |

**Memory is intrinsic. The other three are shipped.** That is where the difference in
rigour comes from. A memory block is private, cheap to correct, and reaches one machine, so
a fact can go in the moment it is said. A skill, an agent definition, or a rule is read by
every agent in every repo the stack reaches, gets reviewed, and is hard to walk back. It
has to earn the place.

The timing follows from the same thing. A fact about the user is true as soon as they say
it. A method is not known to work until it has worked more than once, so a skill written in
the moment of relief encodes a coincidence. Wait for the work to land.

One artifact is shipped and still does not wait: a `<handle>-mode` skill, owned by
`working-style`. Taste is declared by the person rather than proven by evidence, so it is
recorded as soon as it is stated. Everything this skill writes claims that a method works,
which is why it waits. A finding that is really a preference goes there, not here.

The other two neighbours: `handoff` owns the record kept **during** a build, and that record
is this skill's best input. `drift-audit` owns the corpus going **stale**, working from the
artifacts rather than from a transcript. Knowledge in, versus claims out.

## Procedure

### 1. Gather the record, cheapest first

The build log is pre-digested and small. Read it before touching a transcript:

```sh
ls "$(git rev-parse --show-toplevel)"/.handoff-*.md 2>/dev/null
```

Its four entry types are already the signals worth mining: a decision with a rejected
alternative, a deviation from the plan, something tried that failed, a constraint
discovered. If a log exists, most of the work is done.

Transcripts hold what the log missed. For Claude Code they are under
`~/.claude/projects/<slug>/<session>.jsonl`, where `<slug>` is the workspace path with `/`
replaced by `-`. Stay inside the current workspace's directory; other directories are
unrelated projects and reading them leaks context that has nothing to do with this repo.

```sh
ls -t ~/.claude/projects/<slug>/*.jsonl | head
```

**Take more than one session when you can.** Recurrence across sessions is the evidence
that something generalizes, and step 3 depends on having it.

### 2. Delegate the mining

Transcripts run to megabytes. Reading one here spends the context that should hold the
judgment, so hand each to a subagent that returns findings rather than text. Pass
`references/miner.md` verbatim, once per lens:

| Lens | Looking for |
| --- | --- |
| Route | The approach that worked, and the ones tried first. The dead ends are the valuable half. |
| Correction | Where the user redirected, and what the agent had assumed to need redirecting. |
| Mechanism | Facts about tools, flags, paths, and APIs learned by being wrong about them. |

Run them in parallel. Each returns findings with evidence pointers, and no file writes:
this skill applies the edits, so a miner that edits has escaped its context budget for
nothing.

### 3. Apply the recurrence test

This is the step that decides whether the corpus stays readable. **The default answer is
no.** A corpus that grows by one artifact per anecdote stops being loaded.

A finding earns a place only with a second occurrence:

- It happened in another session, or another repo, or twice in this one.
- Or the user stated it as a standing preference rather than a fix for this case.
- Or it is a fact about a tool, which recurs by definition.

Then name the next situation it applies to, and it cannot be the one it came from. "Next
time we add a validator check" is a situation. "Next time this exact bug appears" is a war
story. Drop the war stories out loud, so the reader knows they were considered.

### 4. Choose the form

Most learnings are not skills. Pick by how the knowledge gets used, not by how much of it
there is:

| What was learned | Where it goes |
| --- | --- |
| It applies to essentially all code | one line in `rules/RULES.md` |
| A recognizable situation, and what to do in it | a skill, usually an edit to one that exists |
| A way of *looking* that took a whole context to do well | an agent definition, with its disposition and return contract |
| A long procedure inside a skill that exists | a playbook under it |
| Lookup material, read occasionally | a reference under the owning skill |
| A machine could decide it | a check or a lint rule, never prose |
| It is true of one repo | that repo's `AGENTS.md` |
| It is true of the user, not the work | memory, via `continual-learning` |
| It happened once | nothing |

The agent row is the one most often missed. When the lesson is that some work needs its own
context and a narrow output, a skill telling an agent to be careful will not reproduce it.
The disposition is the content: "try to refute this" is a different agent from "review
this", and that difference is what got learned.

Two rules override the table. **Prefer editing an existing artifact to adding one**, since
a near-duplicate is worse than a gap. And **anything mechanically checkable becomes a
check**: prose asking an agent to remember a number is a rule that gets followed until it
does not.

### 5. Write it so it is repeatable, not just recorded

A captured recipe that omits these is a story about a session:

- **The verification.** How the next agent knows it worked. Steps without a check produce
  the same confident wrong claim that made the original session long.
- **The dead ends.** What looks right and fails, and why. Negative knowledge is most of the
  time saved, and it is the part a fresh agent cannot derive.
- **The trigger.** The situation, in words someone would actually use. A skill nothing
  loads is not a capability.

Hand the edit to `thiamine-author`, which owns shape, dependency declaration, and the
description. Say whether each item is new or an edit.

### 6. Present before applying

Show the findings, their routing, and what you dropped. Wait for approval.

These edits change how every future session behaves in every repo the stack reaches. That
blast radius is larger than any single session's learnings justify spending unreviewed.

### 7. Land it

Commit with `reflect` in the message, so the next pass can bound its window:

```sh
git log --oneline -1 --grep=reflect
```

## Verify

- `node scripts/validate.mjs` is clean for every artifact touched.
- Every kept finding names its second occurrence and its next situation.
- Every dropped finding is listed with the reason.
- For a new or re-described skill, type one of its triggers and confirm it loads. Nothing
  static proves a description works.

## Do not

- Create a skill per session. If a pass yields more than two or three artifacts, the
  recurrence test was not applied.
- Capture a summary of the session. The deliverable is a capability, not a retrospective.
- Read transcripts in this context. Delegate, or the judgment has no room left.
- Encode a project's module names into the stack. Those go in the repo's own `AGENTS.md`,
  where they are true.
- Apply edits without approval.

## References

- `references/miner.md`. Pass verbatim to each mining subagent in step 2.
