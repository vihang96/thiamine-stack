---
name: unslop-rust
description: "Rejects low-evidence Rust: unwrap, swallowed errors, undocumented unsafe, tautological tests, meta design docs, and C-shaped code ported into Rust. Use when reading or editing any .rs file, when reviewing a Rust diff, when fighting the borrow checker into compiling, or when a Cargo crate is being set up."
owns: "Rust correctness and API discipline, meaning what the compiler and the type system have to prove"
see_also: [unslop-prose]
---

# Unslop Rust

Let the compiler carry the proof. Rust slop takes two shapes. One is code that discards
evidence the compiler was willing to check, usually with `unwrap`, a swallowed error, or an
`unsafe` block with no stated invariant. The other is another language's architecture
wearing Rust syntax.

Two rules outrank everything below. Prefer the change that makes the bad state
unrepresentable over the change that checks for it. When a criterion here would make the
code worse, override it with `#[expect(..., reason = "...")]` so the override expires when
it stops being needed.

## Scope

This skill owns Rust correctness and API discipline. General engineering rules stay in
`rules/RULES.md`, and prose belongs to `unslop-prose`, including doc comments and the
reason text on an override.

The criteria here are the anti-slop subset of a larger standard. Each row cites its
guideline id, so the full set stays findable. The lints are configured in `lint/rust/`.

## Panics and errors

| Criterion | What it requires | Enforceable by |
| --- | --- | --- |
| Bugs panic, failures return | A detected programming error panics. A fallible operation returns `Result`. Do not invent an error type for a broken invariant, because no caller can act on it. (M-PANIC-ON-BUG) | review |
| Panic means stop | A panic is a request to end the program, not a control-flow tool to catch later. (M-PANIC-IS-STOP) | review |
| Panics say what broke | A custom panic names the invariant that failed, in terms the reader can act on. (M-PANIC-MESSAGE) | review |
| No `unwrap` | `unwrap` throws away the reason. Use `expect` with a message naming the invariant, or handle the empty case. | `clippy::disallowed_methods` |
| Document what panics | A public function that can panic says so in a `# Panics` section. | `clippy::missing_panics_doc` |
| Never discard an error | `map_err(\|_\| ...)` and a dropped `Result` erase the only evidence of what failed. | `clippy::map_err_ignore`, `clippy::unused_result_ok` |
| Libraries do not choose the caller's error type | `anyhow` and friends belong to applications. A library returns an error the caller can match on. (M-APP-ERROR) | review |

## Unsafe

| Criterion | What it requires | Enforceable by |
| --- | --- | --- |
| Unsafe states its invariant | Every `unsafe` block carries a comment naming what makes it sound. (M-UNSAFE) | `clippy::undocumented_unsafe_blocks` |
| Unsafe means undefined behavior is possible | `unsafe` marks code where the compiler stopped checking, not code that is merely delicate. (M-UNSAFE-IMPLIES-UB) | review |
| Soundness is not negotiable | Safe code must not be able to cause undefined behavior, whatever it passes in. (M-UNSOUND) | review |
| No stale safety prose | A safety comment on code that is not unsafe teaches the reader the wrong thing. | `clippy::unnecessary_safety_comment`, `clippy::unnecessary_safety_doc` |
| `unsafe` inside `unsafe fn` is still marked | An `unsafe fn` body is not implicitly an unsafe block. | `rustc::unsafe_op_in_unsafe_fn` |

## Types and API surface

| Criterion | What it requires | Enforceable by |
| --- | --- | --- |
| Strong types over primitives | Wrap a meaningful value in a type rather than passing a bare `String` or `u64`. (M-STRONG-TYPES) | review |
| One path per item | An item is reachable through exactly one public path. Two paths for one type make every doc link and import a coin flip. (M-SINGLE-ITEM-PATH) | review |
| No glob re-exports | `pub use foo::*` makes the public surface change whenever `foo` does. (M-NO-GLOB-REEXPORTS) | review |
| Public types implement `Debug` | A caller who cannot print your type cannot debug their own program. (M-PUBLIC-DEBUG) | `rustc::missing_debug_implementations` |
| Types users read implement `Display` | If a value reaches a user, it renders deliberately rather than through `Debug`. (M-PUBLIC-DISPLAY) | review |
| Do not leak dependency types | A type from a dependency in your public API makes that dependency's version yours. (M-DONT-LEAK-TYPES) | review |
| Avoid statics | Global mutable state is the pattern most often ported from another language and least often correct in Rust. (M-AVOID-STATICS) | review |
| Escape hatches stay available | Where you wrap something, let the caller reach the thing you wrapped. (M-ESCAPE-HATCHES) | review |

## Tests

| Criterion | What it requires | Enforceable by |
| --- | --- | --- |
| Tests do not assert ground truth | A test that restates a constant, or mirrors the branches of the code under test, passes by construction and proves nothing. Assert a property instead. (M-TAUTOLOGICAL-TESTS) | review |
| Do not assert on `Result` state | `assert!(result.is_ok())` discards the error it just proved existed. Unwrap the value or match the error. | `clippy::assertions_on_result_states` |
| Syscalls are mockable | Put the boundary behind a trait so a test can run without the machine. (M-MOCKABLE-SYSCALLS) | review |

## Documentation and naming

| Criterion | What it requires | Enforceable by |
| --- | --- | --- |
| No meta design documentation | Document the end state, not the journey. A "why we chose X over Y" essay, a design journal, or a table of guidelines you claim to have followed is process, and it goes stale. (M-NO-META-DESIGN-DOCUMENTATION) | review |
| First doc sentence is one short line | About fifteen words, on its own. It is what shows up in the index. (M-FIRST-DOC-SENTENCE) | `clippy::too_long_first_doc_paragraph` |
| Docs have the canonical sections | `# Errors`, `# Panics`, `# Safety` where they apply. (M-CANONICAL-DOCS) | review |
| Names are free of weasel words | `Manager`, `Helper`, `Util`, `Data`, and `Info` name nothing. (M-WEASEL-WORDS) | review |
| Names are short in context | A method on `Config` does not repeat `config`. (M-SHORT-NAMES) | review |

## Rust-shaped code

| Criterion | What it requires | Enforceable by |
| --- | --- | --- |
| Rust code solves Rust problems | Port the domain, not the technical construct. Business logic can look similar across languages. A striking structural resemblance to the C# or Java original is the symptom, and `throw_if_null()` never makes sense. (M-RUST-SHAPED) | review |
| Macros are a last resort | Reach for a function, a trait, or a generic first. (M-MACRO-LAST-RESORT) | review |
| Macros do not lie | A macro expands to what its name and signature imply. (M-MACROS-DONT-LIE) | review |
| No `print` in shipped code | `println!` and `dbg!` are debugging leftovers. Emit a structured event. (M-LOG-NOT-PRINT) | `clippy::disallowed_macros` |
| Logs are structured | Named properties and a message template, not a formatted string. Formatting a string allocates at the call site for output nobody may read. (M-LOG-STRUCTURED) | review |
| Overrides expire | Override a lint with `#[expect(..., reason = "...")]`, not `#[allow]`. An expectation that stops being needed reports itself. (M-LINT-OVERRIDE-EXPECT) | `clippy::allow_attributes_without_reason` |

## Enforcement status

The lints named above are configured in `lint/rust/`, and `scripts/validate.mjs` fails if
this skill names a lint that is not there. Wiring them into a crate is `lint/rust/README.md`.

Rust has no stable plugin API for custom lints, so the enforceable half of this standard is
configuration rather than code. `clippy.toml` is the one place a project-specific
prohibition can be authored, and it carries the `unwrap` and `print` rules above. Anything
needing more than a path match stays `review`.

Sources: Microsoft Pragmatic Rust Guidelines, `microsoft.github.io/rust-guidelines`, MIT
licensed, fetched 2026-08-25. The `M-` ids are theirs and stable, so a row can be traced
back to its full text. Their set has 89 guidelines. This skill carries the anti-slop
subset.

## Worked example

Before:

```rust
pub fn load(path: &str) -> Result<Config, String> {
	let text = std::fs::read_to_string(path).map_err(|_| "read failed".to_string())?;
	let cfg: Config = toml::from_str(&text).unwrap();
	println!("loaded {}", path);
	Ok(cfg)
}
```

After:

```rust
/// Reads and parses the config at `path`.
///
/// # Errors
///
/// Returns [`ConfigError::Read`] if the file cannot be read, and
/// [`ConfigError::Parse`] if its contents are not valid TOML.
pub fn load(path: &Path) -> Result<Config, ConfigError> {
	let text = std::fs::read_to_string(path).map_err(ConfigError::Read)?;
	let config = toml::from_str(&text).map_err(ConfigError::Parse)?;
	event!(name: "config.load.success", Level::INFO, config.path = %path.display());
	Ok(config)
}
```

What each criterion fixed. `map_err(|_| ...)` dropped the `io::Error` that said which file
and why, so the error now carries it (never discard an error). `unwrap` became a typed
parse error (no `unwrap`). `Result<_, String>` became a matchable enum, since a caller
cannot branch on a sentence (libraries do not choose the caller's error type). `&str`
became `&Path` (strong types over primitives). `println!` became a structured event with a
named property (no `print` in shipped code, logs are structured). The `# Errors` section
appeared because the function returns `Result` (docs have the canonical sections).

More examples live in `references/patterns.md`.

## Review checklist

Run this against a finished Rust diff.

1. Does any `unwrap` remain, and does every `expect` name the invariant it relies on?
2. Does any error path discard the original error?
3. Does every `unsafe` block state what makes it sound?
4. Can a caller match on the errors this code returns, or only read them?
5. Does any test assert a constant against itself, or mirror the branches it tests?
6. Does any public type lack `Debug`, and does any user-facing type lack `Display`?
7. Does the public surface expose a dependency's types, or reach one item by two paths?
8. Does any doc describe how the change was designed rather than what the code does?
9. Does the structure resemble the language it was ported from more than it resembles Rust?
