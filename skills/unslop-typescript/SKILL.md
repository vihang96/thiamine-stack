---
name: unslop-typescript
description: 'Rejects low-evidence TypeScript: as casts, unknown in contracts, optional-field bags, broad dictionary types, module mocks, and runtime typeof narrowing. Use when reading or editing any .ts or .tsx file, when reviewing a TypeScript diff, or when types are being loosened to make an error go away.'
owns: 'TypeScript type discipline, meaning what the type system has to prove rather than assume'
see_also: [unslop-prose]
---

# Unslop TypeScript

Make the type system carry the evidence. Most TypeScript slop is a value whose shape was
known, widened to make a compiler error go away, and then asserted back later. The result
compiles, reads as typed, and proves nothing.

Two rules outrank everything below. Prefer the change that makes the illegal state
impossible to construct over the change that checks for it at runtime. When a criterion
here would make code worse, say which one you are setting aside and why, in the code.

## Scope

This skill owns TypeScript type discipline. It covers what a signature promises, where
untrusted data is parsed, and which narrowing is admissible.

General engineering rules stay in `rules/RULES.md`. Scope, abstraction, error handling,
and diff hygiene are not language-specific and are not repeated here. Prose belongs to
the `unslop-prose` skill, including the comments and commit messages that accompany a
TypeScript change.

One overlap is deliberate. `rules/RULES.md` says a test asserting on a mock tests the
mock. The Real tests criterion below is the TypeScript form of the same rule, and it is
mechanically enforceable, which the general rule is not.

## The seam that looks like a contradiction

`unknown` is correct at exactly one place and wrong everywhere else.

At a boundary, untrusted input starts as `unknown` and gets parsed into a named domain
type. That is the point of `unknown`.

In a contract, `unknown` is a refusal to say what a function takes or returns. A parameter,
a return type, or a type alias that resolves to `unknown` pushes the parsing burden onto
every caller, forever.

So: parse `unknown` at the edge, and never let it cross into a signature. A source that
tells you to prefer `unknown` over `any` and a lint rule that rejects `unknown` returns are
both right. They are talking about different positions in the same flow.

## Modeling criteria

| Criterion                 | What it requires                                                                                                                                                                        | Enforceable by             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Discriminated unions      | Model variants with a `kind` literal discriminant. No bags of optional fields that encode state by absence.                                                                             | review                     |
| Constructive modeling     | Build the shape so the illegal value cannot be constructed. `[T, ...T[]]` for non-empty, `start` plus `duration` for a range. Not a runtime guard, and not a wish for refinement types. | review                     |
| Simplest total type       | Keep `T[]` while every operation on it stays total. Strengthen to a non-empty type only where the loose type forces a `!`, a cast, or a should-never-happen throw.                      | review                     |
| Branded types             | Brand primitives that can be confused, and validate once at creation.                                                                                                                   | review                     |
| Schema-derived types      | Reach for `Pick`, `Omit`, `Parameters`, `ReturnType`, `Awaited`, or `typeof` before declaring a new interface that restates an existing one.                                            | review                     |
| Names describe the domain | Name a type for what it means, not for the library that produced it. A validator's internal vocabulary does not belong in a domain name.                                                | `no-shape-in-symbol-names` |

## Evidence criteria

| Criterion                    | What it requires                                                                                                   | Enforceable by                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| No `as` casts                | Every assertion is a runtime crash with the alarm disconnected. Parse, then use the parsed value.                  | `no-chained-type-assertions`, `require-safety-comment-for-type-assertion` |
| Never widen then assert      | Do not widen a value whose shape you already know and assert it back later. Keep the narrow type.                  | `no-widen-then-assert`, `no-known-value-widening`                         |
| No `unknown` in contracts    | Parameters, return types, and aliases state a real type. The `cause` convention on errors is the exception.        | `no-unknown-parameters`, `no-unknown-returns`, `no-unknown-type-aliases`  |
| No broad input types         | `object`, `{}`, and `any` on a function input accept everything and promise nothing.                               | `no-object-parameters`                                                    |
| Typed dictionaries           | A dictionary states its value type. `Record<string, unknown>` is a parse input, never a stored shape.              | `no-unsafe-dictionary-type`                                               |
| No reflection escape hatches | `Reflect.get` and `Reflect.apply` route around the type system. Use typed access, or parse at the boundary.        | `no-reflect-get`, `no-reflect-apply`                                      |
| No conditional empty spread  | Do not use `...(cond ? { x } : {})` to omit a field. Make the field optional in the type, or build the two shapes. | `no-conditional-empty-object-spread`                                      |

## Narrowing criteria

| Criterion                           | What it requires                                                                                                                                                         | Enforceable by      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| Narrowing hierarchy                 | Prefer a discriminant switch. Then `in`. Then `typeof` or `instanceof`. Then a user-defined guard. An assertion is not narrowing.                                        | review              |
| Boundary parsing over ad hoc checks | Parse untrusted data once, at the edge, into a domain type. Scattered `typeof` checks are that parse, done badly and repeatedly.                                         | `no-runtime-typeof` |
| Honest type guards                  | A guard has to verify the claim it makes. A lying guard is worse than an assertion, because the bug hides behind a name that says it is safe. Name them `isX` or `hasX`. | review              |
| Exhaustiveness                      | Put `const _exhaustive: never = x` in the default arm so the compiler fails when a variant is added.                                                                     | review              |
| `satisfies` over `as`               | `satisfies` checks the value against the type without widening the literal.                                                                                              | review              |

## Runtime criteria

| Criterion              | What it requires                                                                                                                                                                  | Enforceable by      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Real tests             | Do not mock what you can run. Use real seams and real test primitives. Mock only what cannot run locally.                                                                         | `no-module-mocking` |
| Object arguments       | Pass an options object rather than several positional parameters, so call sites document themselves. Skip this on hot paths such as per-frame rendering, tokenizers, and parsers. | review              |
| Structured diagnostics | Log through a structured logger with enough context to debug from an id. No `console.log` in shipped code.                                                                        | review              |

## Enforcement status

The rules named in the Enforceable-by column live in `lint/typescript/`, vendored into
this repo. `scripts/validate.mjs` fails if this skill names a rule that is not there, so
the column cannot claim enforcement that does not exist.

One plugin covers Oxlint and ESLint, so a target repo adopts the rules without changing
linters. To wire it into a repo, follow `lint/README.md`, which detects which linter the
repo already uses. Until you do that, these rules are available and not active.

Criteria marked `review` need judgment and no linter decides them. That split is
deliberate and roughly even. When you find yourself wanting a rule for a `review` row,
check first whether it needs type information, because Oxlint has none and a type-aware
rule stops being portable.

Sources: `github.com/dmmulroy/anti-slop` for the Oxlint rule set, MIT licensed, fetched
2026-08-25. `github.com/cursor/plugins`, `pstack/skills/typescript-best-practices`, for the
modeling and narrowing criteria, fetched 2026-08-25.

## Worked example

Before:

```ts
async function loadUser(input: unknown): Promise<unknown> {
	const raw = input as Record<string, unknown>
	const roles = raw.roles as string[]
	return { id: raw.id as string, roles, ...(roles.length ? { primary: roles[0] } : {}) }
}
```

After:

```ts
type User = { id: UserId; roles: [Role, ...Role[]] }

async function loadUser(input: unknown): Promise<User> {
	return parseUser(input) // throws with a parse error naming the offending field
}
```

What each criterion fixed. `Promise<unknown>` became `Promise<User>`, so callers stop
re-parsing what this function already knows (no `unknown` in contracts). The four `as`
casts became one parse at the boundary (no `as` casts, boundary parsing). `Record<string,
unknown>` stopped being a stored shape (typed dictionaries). `string[]` became
`[Role, ...Role[]]`, so `roles[0]` is total and the conditional spread disappears
(constructive modeling, no conditional empty spread). `id: string` became `UserId`
(branded types).

More examples, one per criterion, live in `references/patterns.md`.

## Review checklist

Run this against a finished TypeScript diff.

1. Does any signature take or return `unknown`, `any`, `object`, or `{}`?
2. Does any `as` appear outside a parse, and does each remaining one document the
   invariant it checked?
3. Is any value widened and then asserted back to what it already was?
4. Is untrusted data parsed once at the edge, or checked with `typeof` in several places?
5. Does every union have a discriminant, and does every switch on it fail the build when a
   variant is added?
6. Can any illegal state still be constructed that a different shape would have prevented?
7. Does every type guard verify the claim its name makes?
8. Does any test assert on a mock rather than on a real seam?
