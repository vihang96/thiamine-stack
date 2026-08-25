# Rust lint layer

Rust inverts the TypeScript problem. There is no plugin to write, because clippy has no
stable plugin API, and there is no need for one, because clippy already ships hundreds of
lints. Authoring a Rust rule set means curation and configuration.

```
lints.toml     the lint table to merge into Cargo.toml
clippy.toml    project prohibitions, the one place a custom rule can be authored
fixture/       a crate that must fail, for verifying the wiring
```

Writing custom lint code would mean `dylint`, which pins a specific nightly toolchain per
lint crate. That is a heavy dependency to push onto a target repo, and configuration
covers enough that it has not been worth it.

## Wire it into a crate

Merge `lints.toml` into the crate's `Cargo.toml`. In a workspace, put the tables under
`[workspace.lints]` and add `lints.workspace = true` to each member, so the set is defined
once.

Copy `clippy.toml` to the workspace root. It is read from the directory `cargo clippy`
runs in, not from each crate.

```sh
cargo clippy --all-targets --all-features
```

Preserve whatever the crate already had. If it already sets a lint you are adding, keep
the stricter of the two and say which you kept.

## What clippy.toml buys

`disallowed-methods`, `disallowed-types`, and `disallowed-macros` take a path and a
reason, and clippy prints that reason as a `note:` where the code fails:

```
warning: use of a disallowed macro `std::println`
  = note: no println in shipped code. Use a structured logging event.
```

That is the whole reason to prefer a prohibition over a code review comment. It teaches at
the point of failure, every time, to whoever hit it.

These three lints are off by default, so `lints.toml` sets them to warn. Without that,
`clippy.toml` is silently inert.

## Verify after wiring

```sh
cd lint/rust/fixture && cargo clippy
```

The fixture must report six warnings. Each item in `src/lib.rs` names the lint it trips. A
quiet run means the layer is not loaded, which reads exactly like clean code.

## Source

`lints.toml` reproduces the tables from `M-STATIC-VERIFICATION` in the
[Microsoft Pragmatic Rust Guidelines](https://microsoft.github.io/rust-guidelines/), MIT
licensed, fetched 2026-08-25. The three `disallowed_*` lints and everything in
`clippy.toml` are ours.

The criteria these lints enforce live in `skills/unslop-rust/`. That skill names each lint
in its Enforceable-by column, and `scripts/validate.mjs` fails if it claims a lint that is
not configured here.
