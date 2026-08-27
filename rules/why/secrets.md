---
id: secrets
summary: Report that a secret is present, never what it is. A printed secret is a leaked secret.
enforced_by: review. Secret scanners catch committed values, not printed ones.
---

# Secrets in output

## The failure it prevents

A credential check meant to print `OK` or `MISSING` printed the token instead:

```sh
echo "GITHUB_TOKEN: ${GITHUB_TOKEN:+OK}${GITHUB_TOKEN:-MISSING}"
```

`:+` substitutes when the variable is set, so it yields `OK`. `:-` substitutes only when
the variable is **unset**, so with the variable set it yields the variable's own value. The
line prints `OK` immediately followed by the real token. It reads as a presence check and
behaves as one in the only case anyone tests, which is the missing one.

That check ran before every build and test in a service workspace, and its output went to
the Slack thread the agent was reporting in. Nobody reviewing it saw a bug, because the
logic is right and the substitution is wrong.

The general shape is worse than the specific bug. A secret reaches output through a status
line, a debug print, an exception message that interpolates a config object, a URL with a
token in the query string, or a diagnostic that dumps the environment. Each is written for
a legitimate reason, and each is permanent the moment it lands in a log aggregator, a CI
transcript, or a chat thread.

## The rule

Report presence. Never value.

```sh
[ -n "${GITHUB_TOKEN:-}" ] && echo "GITHUB_TOKEN: OK" || echo "GITHUB_TOKEN: MISSING"
```

Test the variable and emit your own words. Never route the secret through an expansion,
a format string, or a serializer and hope the output is a summary of it.

## What counts

A secret is anything that grants access: tokens, passwords, private keys, session cookies,
connection strings, signed URLs. Treat a value you cannot publish as a secret even when it
is not called one.

Not covered: an account id, a username, a resource name, a public key. Those are
identifying rather than authorizing, and hiding them buys nothing while making output
useless.

## When to override

Never for convenience, and specifically never "just while debugging". A debug print is how
most leaks start, and the log outlives the debugging session.

The one legitimate case is a deliberate reveal a person asked for, at a path built for it:
a `--show-token` flag, a secrets manager's own read command. Even then, do not log it.
Write it to stdout for a human and let them decide where it goes.

## Signals you have violated it

- A presence check whose output length varies with the secret's length.
- A shell expansion with a secret's name inside a string that gets echoed or logged.
- An error message or structured log built from a whole config, credentials and all.
- A test asserting on a redaction, where the unredacted value sits in the fixture.
- Rotating a credential because it appeared somewhere, rather than because it expired.
