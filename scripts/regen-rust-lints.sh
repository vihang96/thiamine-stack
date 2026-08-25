#!/usr/bin/env sh
# Regenerate lint/rust/lints-available.txt from the installed toolchain.
#
# validate.mjs checks unslop-rust's Enforceable-by citations against that file, so a
# citation for a lint added after the snapshot fails until this is run.
set -eu
cd "$(dirname "$0")/.."
command -v clippy-driver >/dev/null || { echo "clippy-driver not found; install clippy" >&2; exit 1; }
{
	echo "# Lint names available to unslop-rust's Enforceable-by column."
	echo "#"
	echo "# One name per line, prefixed with its namespace. Underscores throughout, because"
	echo "# that is how a lint is written in Cargo.toml and in an attribute. clippy prints"
	echo "# them with hyphens."
	echo "#"
	echo "# Generated $(date +%Y-%m-%d) from $(rustc --version | cut -d' ' -f1-2) and $(cargo clippy --version)."
	echo "# Regenerate with scripts/regen-rust-lints.sh when the toolchain moves."
	clippy-driver -Whelp 2>&1 | grep -oE 'clippy::[a-z0-9_-]+' | sed 's/clippy:://; s/-/_/g' | sort -u | sed 's/^/clippy::/'
	rustc -Whelp 2>&1 | grep -oE '^ {2,}[a-z][a-z0-9_-]+' | tr -d ' ' | sed 's/-/_/g' | sort -u | sed 's/^/rustc::/'
} > lint/rust/lints-available.txt
echo "wrote lint/rust/lints-available.txt ($(grep -vc '^#' lint/rust/lints-available.txt) lints)"
