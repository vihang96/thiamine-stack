---
name: fan-out-work
description: "Runs several subagents in parallel from one session and converges what they return into one coherent change. Use when work splits into units that can run at once, when spawning subagents to investigate or write code in parallel, when a change spans several repos that can be worked simultaneously, and when parallel results need checking for duplication and contradiction before they land."
owns: "parallelism inside one session: the cut, the brief, the drain, and converging the results"
see_also: [working-alongside, land-a-change, pre-implementation, consistency, coherence-reviewer, interrogate]
---

# Fan out work

One session, several subagents, one result. The parent decides the cut, writes each brief,
collects what comes back, and answers the question no single lane can: do these pieces add
up to one change.

Fan-out buys two things. Wall clock, and context, because bulk stays in the subagent and
only the conclusion reaches the parent. It costs the parent's ability to see the work. That
trade is the whole skill.

## Serial first

Fan-out has a floor, and below it the overhead loses to a plain sequential pass. Ask
whether one agent could finish the work in this session. If yes, do that instead and say
so. The corpus this pattern comes from measured its own orchestration landing one unit
while a plain agent landed twelve.

Read-only fan-out has no floor. Investigation, blast radius, and review across many files
or repos are free to parallelize because nothing merges. Reach for that shape first and
often; `playbooks/read-fanout.md` covers it.

## Scope

This skill owns parallelism the parent controls: subagents it spawned, in one session.

`working-alongside` owns parallelism the parent does not control, which is another session
or another person already working in the same repo. The difference is authority. Here one
agent decided the cut, so interference is a planning mistake rather than a discovery.

`land-a-change` owns the worktree and branch mechanics each lane runs inside, and
the pull request at the end. `pre-implementation` owns whether the work was understood and
sequenced at all, and its `plan-the-work` playbook is where a fan-out is decided on.

`interrogate` owns what a reviewer is looking for and which findings survive. This skill
owns only the shape of running several of them at once.

`consistency` owns how many answers a concern is allowed. This skill is the largest
manufacturer of second answers there is, which is why converging is a step here rather
than something to notice later.

## Give each lane its own writer

Two lanes writing to one file is a race, whatever the brief says. Instructions are not
concurrency control.

- One branch per lane, and one lane per branch. Git enforces this for worktrees and the
  error names the path already holding it.
- One output file per lane, never a shared file each lane updates its own part of. Merge
  when reading, not when writing.
- One repo per lane where the work spans repos. The repo boundary is real isolation,
  which makes multi-repo the cheapest fan-out shape available.
- Per-lane ports, database names, container names, and build cache directories. A worktree
  isolates files and nothing else, and a collision here fails intermittently in a way that
  reads as a bug in the change.

## How a fan-out runs

1. **Cut the work.** Classify the units and prove they can run at once, per
   `playbooks/cut-the-work.md`. This step decides whether there is a fan-out at all.

2. **Run one lane first.** Take the unit whose brief you are least sure of and run it end
   to end alone, through its verification. It exists to falsify the brief template and the
   verify recipe while that costs one lane instead of five. Fix the contract from what it
   found before spawning the rest. Skip it only when the lanes are near-identical
   mechanical edits, where the first one landing is the pilot.

3. **Write the briefs and spawn.** One brief per lane, per `playbooks/write-a-brief.md`,
   all spawned in one message. A field you cannot fill is a unit you have not scoped, and
   that is a reason to stop rather than to guess.

4. **Drain.** Completions are queue events, not interrupts. Collect them, per
   `playbooks/drain-and-track.md`, which also covers judging whether a quiet lane is alive.

5. **Converge.** Check the union for duplication and contradiction, land in dependency
   order, and verify the integrated result, per `playbooks/converge.md`.

## Playbooks

| Situation | Playbook |
| --- | --- |
| Deciding whether the work splits, and into how many lanes | `playbooks/cut-the-work.md` |
| Writing what a lane is told, before spawning it | `playbooks/write-a-brief.md` |
| Lanes are running, and results are arriving | `playbooks/drain-and-track.md` |
| Lanes have finished, and the pieces have to add up | `playbooks/converge.md` |
| Investigating, reviewing, or searching in parallel, with no writes | `playbooks/read-fanout.md` |

## Verify

A fan-out is finished when every lane has a verdict from something that did not write the
code, the union has been through `playbooks/converge.md`, and the integrated behaviour has
been exercised rather than inferred from the lanes each passing.

A lane's own report that it passed is evidence, not a verdict. `rules/RULES.md` already
says never to claim it works without having run it; with subagents the trap is subtler,
because the parent inherits the confidence of a report it did not check.

## Do not

- Fan out a pipeline. If one lane failing wastes another lane's work, it is a sequence, and
  `pre-implementation`'s `plan-the-work` playbook owns it.
- Spawn a lane whose result cannot be checked without a sibling. That is a step wearing a
  lane's clothes, and it will block.
- Review a diff while draining. A completion that needs review becomes its own unit, or the
  parent stops draining and the lanes queue behind it.
- Merge what you did not read and did not have read. The point of converging is that
  somebody reads the union; delegating that is fine, skipping it is not.
- Resume a subagent to find out whether it is alive. That restarts an idle one.
- Scale the number of lanes to the machine. It is bounded by units that can be verified
  alone, and by how many results the parent can converge.
