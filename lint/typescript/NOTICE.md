# Vendored from anti-slop

`index.ts`, `rules/`, and `shared/` in this directory come from
[github.com/dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop), MIT licensed,
copyright 2026 Dillon Mulroy. The full license text is in `LICENSE`. Vendored on
2026-08-25 from `main`.

Upstream asks to be vendored rather than depended on: "Copy the rules into your
repository, read them, and change them to match your team's standards." That is what this
directory is. Local edits are expected, so do not treat it as a mirror to sync.

`package.json` and this file are not from upstream. The package manifest declares the
exact dependency versions these rules were tested against, so it travels with the
directory when the directory is copied.

The Effect rule group is deliberately absent. Upstream keeps it separate so that projects
which do not use Effect do not inherit Effect architecture policy.

## Why one plugin serves both linters

`index.ts` wraps the rule set in `eslintCompatPlugin` from `@oxlint/plugins`. Rules are
written with Oxlint's `createOnce` API, and the wrapper adds the ESLint-shaped `create`
method that delegates to it. Removing the wrapper makes ESLint throw while Oxlint keeps
working, so it is load-bearing rather than decorative.

The rules stay portable because every one of them is syntactic. They read type
annotations off the AST, never resolved types. Oxlint has no type-aware linting, so a rule
that needs the TypeScript checker would be ESLint-only. Keep new rules syntactic.

The cost of that constraint is real and worth stating: `no-unknown-returns` catches a
written `: unknown` and misses a return whose type is only inferred as unknown.
