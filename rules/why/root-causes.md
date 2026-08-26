---
id: root-causes
summary: Reproduce the failure, then trace it to its cause before fixing. Where a failure surfaces is rarely where it starts.
enforced_by: review, and whether the bug comes back. A test that fails before the fix is the evidence.
---

# Root causes

## The failure it prevents

A list renders blank sometimes. The render function is given `undefined` and throws, so
someone adds a guard: if the data is missing, render nothing. The crash stops. The list
still goes blank, now silently, and the guard has removed the only signal that anything was
wrong.

The cause was two layers up, where a failed fetch resolved to `undefined` instead of
raising. Every consumer of that call has the same bug, and now one of them has a guard that
hides it.

This is the common shape. A symptom appears at a boundary, the boundary is where the stack
trace points, and a fix there is cheap and looks complete. The cause keeps producing new
symptoms, each fixed in the same way, until the system is full of guards that describe a
failure nobody traced.

## The rule

Reproduce it. Then ask what produced the state you are looking at, and keep asking until
the answer is something you can change so that no other symptom can come from it.

## What counts

**Reproduce first.** A fix for a failure you cannot trigger cannot be checked. If it only
happens in production, narrow it until it happens somewhere you control, and treat making
it reproducible as the first task rather than a detour from the real one. Where reproducing
is genuinely impossible, say so, and say what evidence you are reasoning from instead.

**Then trace.** For each step, ask what would have to be true for this to happen. Follow it
back until you reach something that explains the symptom without needing a coincidence.
Stop when the answer is a decision someone made rather than another effect.

**Write the failing test at the cause, not at the symptom.** A test asserting the list does
not go blank passes as soon as you add the guard. A test asserting the fetch raises on
failure fails until the cause is fixed, and it keeps failing if someone reintroduces it.

## When to override

Production is down and a guard stops the bleeding. Add it, say plainly that it is a
tourniquet and not a fix, and open the real investigation. The failure mode here is the
tourniquet staying in and the investigation never happening, so name the follow-up before
the incident closes.

A symptom that is genuinely the cause needs no tracing. A typo in a string is a typo.

## Signals you have violated it

- The fix is a null check, a try that swallows, a retry, or a default value, and you cannot
  say what produced the bad value.
- The test you wrote would pass without the fix.
- You cannot explain why it started happening when it did.
- The same class of bug has been fixed nearby more than once.

## Source

Adapted from `principle-fix-root-causes` in `github.com/cursor/plugins`, fetched 2026-08-25,
which carries no license.
