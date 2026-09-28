---
id: comments
summary: A comment is allowed only when the code cannot carry the fact. Five kinds qualify, and a surprise in our own code is fixed, never explained or marked.
enforced_by: review, and the code-simplifier agent's comment ledger.
---

# Comments

## The five that stay

1. **A legal or license header.**
2. **An external constraint.** Non-obvious behaviour forced by a dependency, platform,
   vendor, or protocol we cannot reshape. Name it, and link the upstream issue when there
   is one.
3. **A suppression.** `// prettier-ignore`, or a lint suppression whose rule is faulty,
   pedantic, or style-only. A suppression that hides a real finding goes, and the code gets
   fixed.
4. **An API contract.** A doc comment that defines a public API: what a caller may pass,
   what comes back, and what fails.
5. **An issue or RFC link** explaining a constraint the code cannot express.

Everything else goes. That includes a caption on the next line, a reason for our own design,
a history of what the code used to do, a section banner, and a note to the reviewer.

## A surprise in our own code

A comment that explains our own code covers for code that should have been obvious. The
comment stays correct until someone changes the code and not the comment. After that it is
wrong, and nothing checks it.

Make the behaviour obvious instead. Rename the symbol, extract the step, add a type that
makes the wrong state unrepresentable, or restructure. Keep the behaviour correct while you
do it. Leave no marker, TODO, or note in the code. A fix too large for the change is raised
with the person who asked for it, not written into the file.

## The failure it prevents

Generated code arrives with a comment on every block. Each one looks helpful on its own, so
review keeps it. Over a few months the comments start describing code that has since
changed, and a reader trusts the comment over the code.
