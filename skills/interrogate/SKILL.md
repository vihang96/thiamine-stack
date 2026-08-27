---
name: interrogate
description: "Reviews an artifact somebody else produced, a human or an agent, and returns feedback precise enough to act on: a plan, a design, a diff, a pull request, or an agent's report. Decides what earns a finding, ranks what is left, stops before the nits, and says plainly when there is nothing to report. Use when reviewing a PR or a diff, when asked to critique or stress test a plan, when checking whether an agent's work is what it claims, and for review this, tear this apart, or find the blind spots."
owns: "judging an artifact someone else produced, and the feedback that goes back to them"
see_also: [fan-out-work, multi-repo-mechanics, post-implementation, pre-implementation, unslop-prose, adversarial-reviewer]
---

# Interrogate

Review is the last cheap place to catch a defect, and the easiest place to produce noise
instead. A reviewer with nothing serious to say fills the space, and thirty findings hide
the two that mattered. The author then learns to skim, which costs more than the review
bought.

Three things outrank everything below.

1. **Establish the intent before judging anything.** You are reviewing whether the artifact
   achieves what it set out to do, not whether you would have designed it that way. If you
   cannot state the intent in a sentence, get it before you review, because a review with
   no intent turns into a list of preferences.

2. **A finding names a failure.** The input or the state, and the wrong result that follows.
   Without both it is a preference, and preferences do not go in a review.

3. **Rank by what breaks, then stop.** Cut at the point where the next finding would not
   change what the author does. No findings is a result, and saying so is the review.

There are two hatches, and they point in opposite directions. The first is severity: a data
loss, auth, or corrupt-state defect goes in the review however long the list already is and
however unsure you are of the rest. Under-reporting one of those is the only failure here
that cannot be undone by a second pass. The second is size, below.

## Scale to the change

Most reviews are one pass. Read the diff, read the enclosing function, say what you found.
Everything below this section is for the changes that earn it, and running it on a rename
produces a verdict longer than the change, which is its own kind of noise.

Take the short path when all three hold:

- **Small and one concern**, readable in a sitting without a map.
- **Reversible.** A revert puts things back. No migration, no deploy ordering, no data
  written in a new shape, nothing already consumed by somebody else.
- **Nothing from the list below.**

The short path is: read every hunk and the enclosing function, check the description's
claims if it makes any, then answer in one or two sentences. No fan-out, no criterion sweep,
no severity table for a single note. Still say what you read and what you did not reach,
because that is the only thing separating a short review from a skipped one.

**Size never lowers the bar on these, whatever the diff looks like.**

- Auth, permissions, sessions, tenancy.
- Secrets, tokens, credentials, and anything logged next to them.
- Money, billing, and quantities that settle.
- Deletion, retention, migration, or anything that rewrites stored data.
- Concurrency, locking, retries, idempotency keys.
- A published contract: an API shape, a proto, an event payload, an exported type.
- Generated files or a lockfile edited by hand.

A one-line change to any of these is where the expensive defects live, and being small is
why nobody looks. `fan-out-work` makes the same argument about its own floor in
`Serial first`, from the other side: below the floor the machinery loses to a plain pass.

The floor is a starting guess, not a commitment. If the short path turns up anything you
cannot trace inside the file in front of you, stop and take the long path.

## Scope

This skill owns the outbound direction: judging somebody else's artifact and returning
feedback on it.

- `multi-repo-mechanics` owns the inbound direction, in its `triage-review-comments`
  playbook. Comments arriving on your own change are classified there, not here.
- `post-implementation` owns whether the person who owns a change can explain and defend
  it. That is a different question from whether the change is any good.
- `rules/RULES.md` and the `unslop-*` skills are the standard a change is measured against.
  This skill does not restate them. It decides which violations are worth an author's time.
- `unslop-prose` owns the words of the review once the findings are settled. A posted comment
  is prose somebody reads, and the tells that matter most in a review are named in
  `playbooks/deliver-the-review.md`.
- `pre-implementation` owns writing a plan. Reviewing one is here.
- `fan-out-work` owns parallel subagents in general. Interrogation is one of its read-only
  shapes, and `playbooks/fan-out-reviewers.md` covers only what is specific to reviewing.

## Use the harness's diff review, do not rebuild it

Claude Code ships a `code-review` skill that already does the bug hunt well. It fans out
across a line-by-line diff scan, a removed-behaviour audit, a cross-file caller trace,
language pitfalls, and wrapper correctness, then puts every candidate past a separate
verifier that returns confirmed, plausible, or refuted, and drops the refuted ones. It also
covers reuse, simplification, efficiency, altitude, and `CLAUDE.md` conventions, scales its
own breadth with the effort level, and can post findings inline with `--comment`.

Run it. Take its output as the candidate list, not as the review. Writing a second
line-level bug hunter here would be exactly the second answer that `consistency` exists to
prevent.

Four things it does not do, which is what the rest of this skill is for.

- Anything that is not a diff. A plan, a design, a spec, an agent's report.
- Whether the change is the right change. It reviews the diff against no stated intent.
- Whether the author's claims are true. "Tested against staging" is a claim, not evidence.
- The verdict and the delivery. What blocks, what to say, and whether to approve.

Codex and Cursor ship no equivalent, so there run the angles yourself per
`playbooks/fan-out-reviewers.md`. Say which of the two happened, because a single-pass
review and a verified fan-out are not the same evidence and should not read the same.

## What earns a finding

- **A failure path you traced.** "This could be nil" is a finding once you name the caller
  that passes nil. Until then it is a worry.
- **Reachable in this artifact.** A defect behind a flag nobody sets, or on a branch the
  types exclude, is at most a note.
- **Caused by this change.** A pre-existing defect inside a function the diff touches is in
  scope, because the change re-exposes it. The same defect three files away is a different
  pull request, and saying so is better than smuggling it in.
- **Not a machine's job.** Imports, types, formatting, and failing tests come back from the
  compiler, the linter, and CI with better precision than you have.
- **Quotable, when it is a convention.** Name the file and quote the line that the change
  breaks. "Against the spirit of the style guide" is not reviewable.
- **Costed, when it is a design opinion.** "I would have done it differently" becomes a
  finding when you can say what the current shape costs: the change it makes hard, the
  state it lets diverge, the caller it will surprise.

## Severity is an action, not an adjective

| Verdict | When | What the author gets |
| --- | --- | --- |
| `blocking` | data loss, auth or security, corrupt state, a regression in shipped behaviour, or the change does not do what it says | changes requested, with what would satisfy it |
| `worth fixing` | a real defect on a reachable path, or a claim that did not survive checking | a comment, marked non-blocking, saying why it is not blocking |
| `note` | true, cheap to say, costs nothing if ignored | one line, grouped with the others, no thread each |
| `dropped` | everything else | the count, not the contents |

Two calibrations. A blocking list should be fixable in one sitting; past roughly five items
you are not filtering, or the change is too big and the useful review is to say that
instead. And a diff that is unreviewable is a finding of its own: a refactor and a feature
travelling together, a generated file mixed into hand-written code, a description that
describes a different change. Report that first, because bug-hunting inside it is wasted
work.

## The nit budget

Findings are not free. Each one costs a read, a decision, and a reply.

- Rank first, cut second. Order by what breaks, then draw the line.
- Cluster repeats. Five instances of one pattern are one finding, one example, and a count.
- A review that is all nits means the artifact is fine. Say that in a sentence rather than
  shipping the nits as evidence you looked.
- Never pad to look thorough. An empty review is valid; a padded one teaches the author to
  skim the next real finding.
- Style is the formatter's or nobody's.

## Say when there is nothing

"No blocking findings" on its own is indistinguishable from not having looked. Make it
checkable: name what you reviewed, how, and what you did not reach.

> No blocking findings. Read every hunk and the enclosing functions, traced the three
> callers of `resolve_guide`, and ran the two touched test files. Two non-blocking notes
> below. I did not exercise the migration against real data, which is the part I would
> want somebody to check.

That is trustworthy because it can be falsified. "LGTM" cannot.

## Reviewing work an agent produced

Same artifact, different failure distribution. A human under-tests; an agent produces
something plausible. Look for the ones that survive a casual read.

- A summary that does not match the diff. Read the diff. The summary is the claim.
- A step in the plan that is missing from the change, with nothing saying so.
- Claims with no evidence: "tests pass" with no output, "verified" with nothing run.
- Scope drift, most often an adjacent refactor folded into a feature.
- An invented stand-in where a real contract was needed, which then becomes the contract.
- Scaffolding left after the migration landed, and `legacy` or `staged` in new names.
- Tests that assert on a mock's return value, or that exist to move a coverage number.
- Defensive branches for states that cannot occur, and a catch that logs and continues.

The language-level ones belong to `unslop-python`, `unslop-typescript`, and `unslop-rust`.
Load the one that matches the diff rather than re-deriving its criteria here.

## Playbooks

| Situation | Playbook |
| --- | --- |
| A plan, design, spec, or RFC, before any code exists | `playbooks/review-a-plan.md` |
| A diff, a branch, or a pull request | `playbooks/review-a-diff.md` |
| The stakes justify more than one pass, or the harness has no diff review | `playbooks/fan-out-reviewers.md` |
| The artifact asserts things: a PR description, an agent's report, a test plan | `playbooks/audit-the-claims.md` |
| Findings exist and have to reach the author | `playbooks/deliver-the-review.md` |

## Worked example

A fan-out over a 400-line pull request returns eleven candidates. Raw:

> 1. `parse_window` returns `None` for an empty range, and the caller dereferences it.
> 2. Duplicate of 1 from another angle, phrased as a missing guard.
> 3. `retry_upload` catches `Exception` and continues, so a failed upload reports success.
> 4. The new `WindowSpec` could be a frozen dataclass.
> 5. `helpers.py` is getting long.
> 6. Prefer `pathlib` over `os.path` in the new function.
> 7. Test names do not follow the `test_<unit>_<case>` convention used elsewhere.
> 8. No docstring on `WindowSpec`.
> 9. The migration has no rollback path, and it drops a column.
> 10. `parse_window` is called in a loop that reparses the same string.
> 11. Variable `x` on line 88 could have a better name.

After ranking and cutting:

> **blocking**, 2. The migration drops `guides.legacy_ref` with no rollback, and a failed
> deploy leaves the column gone (9). `retry_upload` swallows every exception, so an upload
> that failed reports success to the caller at `uploads.py:141` (3).
>
> **worth fixing**, 1. `parse_window` returns `None` on an empty range and `run_window`
> dereferences it at `window.py:62`, which two angles found independently (1, 2).
>
> **note**, 2. Test names diverge from the convention in the same directory (7), and
> `parse_window` reparses one string per loop iteration at `window.py:71` (10).
>
> **dropped**, 4. Style and naming preferences with no cost named.

Findings 4, 5, 6, 8, and 11 are dropped because nobody named what they cost. Finding 2
collapsed into 1, and the fact that two independent angles found it is why it is above the
notes rather than among them. Finding 9 was last in the raw list and is first here, because
ranking is by what breaks and not by the order the reviewers happened to return.

## Review checklist

Run this against your own review, before it goes out.

1. Can you state the intent in one sentence without reading your own findings?
2. Does every finding name the input or state, and the wrong result?
3. Is anything on the blocking list actually a preference wearing a severity?
4. Did you verify each claim you contradicted, including the ones you dismissed?
5. For each finding, would the author know what to do next?
6. Did you say what you did not check?
7. If everything you found is a nit, did you say the artifact is fine?
8. Was the review proportionate? A small, reversible change should have cost the author two
   sentences, not a verdict block.
