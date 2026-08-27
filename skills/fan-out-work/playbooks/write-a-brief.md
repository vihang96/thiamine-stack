### Write a brief

**A subagent starts cold and cannot ask you anything, so the brief is the entire contract.**
For every lane you are about to spawn.

A lane produces exactly what its brief specified and quietly invents the rest. The brief is
the parent's only real product in a fan-out.

1. Fill every field. A field you cannot fill is a unit you have not scoped, and that is a
   reason to go back to `playbooks/cut-the-work.md` rather than to spawn and hope.

   | Field | What it holds |
   | --- | --- |
   | Goal | one sentence, the outcome, readable by someone with no access to this conversation |
   | Scope | the paths this lane may write, and its branch or worktree |
   | Standards | the skills this lane must load before writing anything |
   | Context | what it needs that it cannot see, pasted in rather than pointed at |
   | Acceptance | checkable criteria, one per line |
   | Verify | the exact commands, and the gotchas you already know about |
   | Forbidden | what it may not do, including anything outside Scope |
   | Timebox | roughly how long, and that on expiry it returns partial findings and stops |
   | Report | the shape of what comes back |

2. Name the standards explicitly. This is the field that decides the quality of the output
   and the one most often left out. A lane that never loads the language standard writes
   code to whatever bar the base model has, and a fan-out multiplies that by the number of
   lanes. Name the ones that apply: the language skill for what it is writing,
   `consistency` where it is choosing a pattern, and the decision that step 2 of
   `playbooks/cut-the-work.md` settled.

3. Write Forbidden as though the lane is helpful, because it is. Without it a lane fixes a
   neighbouring bug it noticed, reformats a file it passed through, or rebases to tidy up.
   Standing bans for almost every lane: no writes outside Scope, no rebase or force-push,
   no touching another lane's branch, no merging, no fixing anything it was not asked to
   fix. State a discovered problem in the report instead.

4. Relay context rather than referencing it. A lane cannot see its siblings, so anything an
   upstream unit decided gets pasted into the downstream brief in full. A pointer to a
   conversation the lane cannot read is a blank field.

5. Size the brief to the unit. A page of scaffolding around a two-line edit costs more to
   write and obey than the edit. Collapse it to a paragraph that still names the goal, the
   scope, the verify command, and the report shape.

6. Ask for the report small and pointed. The parent's context is the reason this is a
   fan-out at all, so the return is a verdict, evidence pointers, deviations, and any new
   symbol it introduced. Never the diff, never a narrative of what it did, never a summary
   of files touched.

   Ask for deviations by name. A lane that hit a constraint and worked around it holds the
   only copy of the most valuable thing the fan-out learned.

**Reply:** nothing separate. The briefs are the artifact, and they go out in the spawn.
Where a brief could not be completed, say which field was empty and what would fill it.
