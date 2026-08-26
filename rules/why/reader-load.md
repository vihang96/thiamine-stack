---
id: reader-load
summary: Count the hops a reader traverses and the state they must hold. Both are budgets, and splitting code into smaller pieces spends the first to save the second.
enforced_by: review. Some linters count function length or complexity, which are proxies for this and not the thing itself.
---

# Reader load

Maintainability is the work a reader has to do to understand the code. Two things cost
them, and they are independent:

1. **Hops.** How many indirections sit between the question and the answer.
2. **State.** How much hidden or mutable context they have to hold while tracing.

A flat file with fifty globals is as hard to reason about as a six-layer adapter stack.
Guard both, and notice that the usual fix for one spends the other.

## The failure it prevents

Someone asks where a value comes from. The call goes to a service, which calls a manager,
which calls a repository, which calls a client, which calls the generated stub. Four of
those five have one caller and pass the same arguments through unchanged. Each was added by
someone doing the right thing locally, and together they mean nobody can answer a simple
question without opening five files.

The same code split into thirty single-function files reads as tidy in a directory listing
and costs a reader a file open per step. Splitting is not free. It converts state into
hops.

The reason this survives review is that every individual layer is defensible. The cost is
only visible in aggregate, which is why it needs counting rather than judging.

## The rule

Before adding a layer or a piece of state, ask whether it reduces load somewhere else by at
least as much as it adds here. Collapse the ones that do not.

## What counts

**Layers that do not earn their keep.** A wrapper with one caller is a rename. An adapter
with no second implementation is an interface with one shape. A layer introduced for a
future that never arrived is indirection paid for and never used. Inline all three.

**Pass-through layers.** A layer that repeats the same method names and the same arguments
is not an abstraction, because it compresses nothing. A real boundary changes the vocabulary
between the two sides.

**Interfaces that hide little.** A broad interface over a thin implementation makes the
reader learn both the surface and what is behind it. Prefer a boundary that hides a decision
worth hiding.

**State scope, from cheapest to most expensive.** Prefer a return over a mutation, a local
over a field, a field over module state, and module state over a global. Derive a value
rather than keeping two in sync, because two things that must agree eventually will not.

**Invariants named once.** State the rule at the boundary that enforces it, not in every
consumer that depends on it. A reader learns it once, and there is one place to change.

## The test

Can someone new to the file answer "where does this value come from" and "what can change
it" in about thirty seconds? If not, cut hops or cut state. Which one to cut is answered by
whichever count is higher.

## When to override

A layer that exists for a real second implementation, a genuine test seam, or a boundary
someone else owns is earning its keep. Say which, because the wrapper that exists for
testing and the wrapper that exists from habit look identical.

Depth is sometimes correct. A parser, a compiler, and a protocol stack are layered because
the domain is. The rule is about layers that do not correspond to anything.

## Signals you have violated it

- Answering a question about one value means opening more than three files.
- A file exists to re-export another file.
- A type appears in a signature, a wrapper, and an adapter, unchanged in each.
- The same value is stored in two places and kept in sync by a call somebody has to
  remember.
- A reviewer asks what a layer is for and the answer is what it does rather than why it is
  separate.

## Source

Adapted from `principle-minimize-reader-load` in `github.com/cursor/plugins`, fetched
2026-08-26, which carries no license.
