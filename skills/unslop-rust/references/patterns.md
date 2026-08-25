# Rust patterns

One worked example per criterion, for the ones a single line does not carry. Read the entry
for the criterion you are applying rather than the whole file.

## Bugs panic, failures return

The split is whether a caller could act on it.

```rust
// A broken invariant. No caller can do anything useful with this, so panic.
fn advance(&mut self, steps: usize) {
	assert!(steps <= self.remaining, "advance past end: {steps} > {}", self.remaining);
	self.position += steps;
}

// Parsing is inherently fallible. The caller can retry, prompt, or fall back.
fn parse_uri(text: &str) -> Result<Uri, ParseError> {
	// ...
}
```

Introducing `enum AdvanceError { PastEnd }` for the first case adds a variant every caller
must handle and none can resolve.

## No unwrap, and expect names the invariant

```rust
// rejected: says nothing about why this should hold
let port = config.port.unwrap();

// acceptable: the message names what is relied on
let port = config.port.expect("port is defaulted during load, so it is always present");
```

If you cannot write that sentence, the value is genuinely optional and needs handling
rather than an assertion.

## Never discard an error

```rust
// rejected: loses which file and why
std::fs::read_to_string(path).map_err(|_| ConfigError::Unreadable)?;

// required: keeps the cause
std::fs::read_to_string(path).map_err(ConfigError::Read)?;
```

With the source attached, a support ticket says `Permission denied (os error 13)` instead
of `Unreadable`.

## Libraries do not choose the caller's error type

```rust
// rejected in a library: the caller can print this and nothing else
pub fn load() -> anyhow::Result<Config>

// required: the caller can match
#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
	#[error("could not read config")]
	Read(#[source] std::io::Error),
	#[error("config is not valid TOML")]
	Parse(#[source] toml::de::Error),
}
```

An application binary composing many libraries is where `anyhow` belongs.

## Unsafe states its invariant

```rust
// rejected
let value = unsafe { *ptr };

// required
// SAFETY: `ptr` comes from `slice.as_ptr()` above and `index < slice.len()` was
// checked, so the offset is in bounds and the data is initialized.
let value = unsafe { *ptr.add(index) };
```

The comment is the review artifact. Without it a reader cannot tell a checked invariant
from an assumption nobody verified.

## Strong types over primitives

```rust
// rejected: two interchangeable strings and a naked number
fn transfer(from: &str, to: &str, amount: u64)

// required
fn transfer(from: AccountId, to: AccountId, amount: Cents)
```

Swapping the first two arguments now fails to compile rather than moving someone's money
the wrong way.

## Tests do not assert ground truth

```rust
const CHECKPOINTS: [u32; 4] = [0, 90, 180, 270];

// rejected: restates the constant, passes by construction
#[test]
fn checkpoints_are_correct() {
	assert_eq!(CHECKPOINTS, [0, 90, 180, 270]);
}

// required: asserts the property the constant exists to satisfy
#[test]
fn checkpoints_are_evenly_spaced() {
	let gaps: Vec<_> = CHECKPOINTS.windows(2).map(|w| w[1] - w[0]).collect();
	assert!(gaps.iter().all(|&g| g == gaps[0]), "uneven: {gaps:?}");
}
```

The second test fails if someone inserts a checkpoint. The first only fails if someone
edits both the constant and the test, which they will, together, without thinking.

## Do not assert on Result state

```rust
// rejected: proves an error existed, then throws it away
assert!(parse(input).is_err());

// required: assert which error
assert!(matches!(parse(input), Err(ParseError::UnexpectedEof)));
```

## No meta design documentation

Belongs in a pull request description, and nowhere in `//!` or `///`:

- why an approach was chosen over another
- a summary of what changed in this commit
- a table of guidelines the author claims to have followed

Document the end state. A reader of the docs wants to know what the code does now, and a
design journal goes stale the next time anyone touches it.

An enduring architectural property is different and belongs in the README. "Allocation
free" and "works under `no_std`" stay true.

## Rust code solves Rust problems

```rust
// rejected: ported straight from C#
fn throw_if_null(value: Option<&Config>) -> &Config {
	value.expect("null")
}

// required: the type already says it
fn use_config(config: &Config)
```

The tell is structural resemblance. Business logic may look similar across languages.
Error handling, ownership, task management, and abstraction boundaries should not, because
those solve problems specific to their ecosystem.

## Overrides expire

```rust
// rejected: silent forever, even after it stops applying
#[allow(clippy::unused_async)]
pub async fn ping() {}

// required: warns once it is no longer needed
#[expect(clippy::unused_async, reason = "API is fixed, will do I/O in the next change")]
pub async fn ping() {}
```

`#[allow]` still has a place on generated code and inside macros, where the expectation
cannot be relied on to trigger.
