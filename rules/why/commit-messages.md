---
id: commit-messages
summary: Write the commit message in the repo's convention. Where release tooling reads commits, a malformed message fails a check and a wrong type ships a wrong version.
enforced_by: cocogitto (`cog check`), commitlint, or the repo's own hook. Nothing catches a well-formed message with the wrong type.
see_also: [handoff, capture-preferences]
---

# Commit messages

## The failure it prevents

Two failures, and the second is worse.

A malformed message fails a check. Where a repo runs `cog check` or commitlint, usually in
a pre-push hook or a CI job, a subject that does not parse is rejected. The work is done,
the code is right, and the push is refused for the shape of a sentence. Reaching for
`--no-verify` at that point skips every other hook in the same breath.

A well-formed message with the wrong type ships the wrong version. Release tooling reading
the conventional-commits preset maps the type to a version bump: `fix` to a patch, `feat`
to a minor, a `BREAKING CHANGE:` footer to a major. Label a breaking change `fix` and the
release is a patch, consumers take it automatically, and their build breaks. Nothing checks
this, because the message is valid. It is only wrong.

## The rule

Read the repo's convention before writing the message. Match it, keep the subject short and
imperative, and pick the type by what the change does to a consumer rather than by how much
work it was.

## What counts

Look for the convention before guessing. `cog.toml`, `.commitlintrc`, `.releaserc`,
`release.config.js`, or a `CONTRIBUTING.md` section. Recent `git log` shows what the repo
actually does, which is not always what its config says.

Where the convention is conventional commits, the shape is `type(scope): subject`:

- `fix` for a bug a consumer could hit, which is a patch release
- `feat` for a capability a consumer gains, which is a minor release
- `refactor`, `test`, `docs`, `chore`, `perf`, `build`, `ci` for changes that release nothing
- `BREAKING CHANGE:` in the body, or `!` after the type, for anything a consumer must react
  to, which is a major release

The subject is imperative and lowercase after the colon, with no trailing period. Most
setups cap it, often at 72 characters. The body is for why, wrapped, and separated by a
blank line.

A merge commit is usually exempt, and tooling often skips it explicitly.

## How long

The subject is short and imperative, and the body exists only where the diff does not
already carry the why.

Keep the body shorter than the change it explains. A body longer than its diff is an essay,
written to show the work rather than to be read, and it comes from the same instinct as a
plan longer than the change. A reader opens a commit message to find out why something was
done, having already seen what was done.

One consequence worth stating, since it is where this usually goes wrong. A run of attempts
that ended in one commit does not put all of them in the message. Rejected approaches, bugs
found and fixed along the way, and the reasoning you are proud of are all history rather than
explanation. Where that history has value, it belongs in the record the work kept, and the
`handoff` skill owns that.

This names a bar rather than a number. Where a person has a length preference,
`capture-preferences` records theirs and it wins.

## When to override

A repo with no convention and no tooling does not need one imposed. Match the surrounding
history instead.

Never override by adding `--no-verify` to get a push through. That skips every other hook
the repo installed, including the ones that were catching something real. Fix the message.

## Signals you have violated it

- A push was rejected by a hook that named the commit message.
- The release notes contain an entry nobody would call a feature.
- A version bumped in a way that surprised someone, or did not bump when it should have.
- The subject needs a comma to hold two clauses, which usually means two commits.
