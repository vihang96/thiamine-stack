### Prototype

**A throwaway built to settle one decision.** For "mock it up", "try a few directions",
"what should this look like", and for any fork you were about to ask about that running
something would answer.

This is the one place the usual standards invert. Speed beats polish, the code does not
matter, and nothing here ships. The rigor is in choosing the decision and reading the
result, not in the artifact.

1. Name the decision first. Which layout, which interaction, which shape the data takes,
   whether an approach is fast enough. No decision means no prototype, and building to
   "explore" produces something that looks like an implementation and gets treated as one.

2. Build it somewhere it cannot be mistaken for the real thing. A scratch directory outside
   the source tree, never a branch of production code. Anything that lives next to real
   code eventually gets imported by it.

3. Branch on what kind of decision it is. The two modes below want different artifacts and
   different evidence.

4. Present alternatives, the evidence, and a recommendation. Say plainly that the artifact
   is throwaway, and hand the chosen direction to the plan. Nobody should have to ask
   whether this is shippable.

## An experience decision

Layout, interaction, density, wording, the shape of a flow. The eye is the test.

**Gather references before building when the space is open.** Prior art, competitors, the
rest of the product. Show the directions and let the user pick before you spend effort
rendering one. Skip this when the direction is already set.

**Fake everything behind the surface.** Hardcode the data, stub the network, fake the
latency if latency is part of the feel. A facade renders in an hour what a wired
implementation renders in a day, and the decision is the same either way. Wiring it up is
the tell that you have started building rather than deciding.

**Use the lightest thing that renders.** One self-contained HTML file with inline CSS and
whatever comes from a CDN. No build step, no framework, no components, no tests. It has to
open in a browser and be deletable without ceremony.

**Build the alternatives together, behind one switcher.** Two or three directions, each
labeled, toggled by a button or a key. Side by side is how a difference becomes visible,
and a label is what lets someone say "the second one" instead of describing it.

**Exhaust the space before converging.** Include a direction nobody asked for. The value is
in the option that was not on the list, and the cost of one extra variant in a facade is
minutes. Then screenshot each and look, because the eye catches what a description does not.

## A domain or architecture decision

The shape of the data, the states a thing can be in, where a boundary sits. The artifact is
the model, not a running system.

**Write the target as if it had been there from the start.** Do not design the migration
into the model. A target shape carrying transitional fields, dual-write paths, and
compatibility shims is not the target, it is the migration wearing the target's name, and
those states outlive the migration because nothing ever forces their removal. Getting from
here to there is the plan's problem, and keeping the two apart is what makes the target
worth converging on.

**Make the model refuse what should not exist.** The point of writing the types out is to
see which illegal states the shape still admits. A model that can express a cancelled order
with a delivery date will eventually hold one.

**Test it by expressing real cases.** Take four or five scenarios from the actual system,
including the two awkward ones everyone mentions, and write each in the model. The ones
that do not fit are the finding. This is the whole test, and it is cheaper than any
argument about the design.

**Compare shapes, do not defend the first.** Write the second model. A state machine against
a status field, a tagged union against optional fields, a registry against a chain of
conditionals, a reducer against scattered mutations. Writing both takes an hour and settles
what a discussion will not.

**Organise around the domain, not around the order things happen.** Modules named `load`,
`validate`, `transform`, and `save` repeat the same domain rules at every step, because
execution order is not ownership. Group by the body of knowledge instead, so a rule about an
order lives in one place regardless of when it runs.

**Know the tells that you skipped this.** A new requirement that grows an existing chain of
conditionals by one more branch. A second boolean that has to stay in sync with the first. A
shape assumption repeated in four files. Each says the domain is being carried in the code
rather than in a structure.

**Do this now rather than later.** A data-structure change late is a rewrite, and early it is
often a one-line diff. That gap is the entire reason this is a pre-implementation activity
and not something to revisit during review.

**Reply:** the decision it was built to settle, the variants explored, the evidence, which
one you recommend and why, and the scratch path. For an experience decision include the
screenshots. For a domain decision include the scenarios the model handled and the ones it
could not. Say that the artifact is throwaway.
