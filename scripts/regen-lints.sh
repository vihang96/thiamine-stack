#!/usr/bin/env sh
# Regenerate lint/<language>/lints-available.txt for every language whose toolchain is
# installed. validate.mjs checks a skill's Enforceable-by citations against these files,
# so a citation for a lint added after the snapshot fails until this is run.
#
# A language whose toolchain is absent is skipped and its snapshot left alone.
set -eu
cd "$(dirname "$0")/.."

header() {
	echo "# Lint names available to unslop-$1's Enforceable-by column."
	echo "#"
	echo "# One name per line, prefixed with its namespace."
	echo "#"
	echo "# Generated $(date +%Y-%m-%d) from $2."
	echo "# Regenerate with scripts/regen-lints.sh when the toolchain moves."
}

if command -v clippy-driver >/dev/null 2>&1; then
	{
		header rust "$(rustc --version | cut -d' ' -f1-2) and $(cargo clippy --version)"
		echo "#"
		echo "# Underscores throughout, because that is how a lint is written in Cargo.toml and"
		echo "# in an attribute. clippy prints them with hyphens."
		clippy-driver -Whelp 2>&1 | grep -oE 'clippy::[a-z0-9_-]+' | sed 's/clippy:://; s/-/_/g' | sort -u | sed 's/^/clippy::/'
		rustc -Whelp 2>&1 | grep -oE '^ {2,}[a-z][a-z0-9_-]+' | tr -d ' ' | sed 's/-/_/g' | sort -u | sed 's/^/rustc::/'
	} > lint/rust/lints-available.txt
	echo "rust:   $(grep -vc '^#' lint/rust/lints-available.txt) lints"
else
	echo "rust:   skipped, clippy-driver not found"
fi

if command -v ruff >/dev/null 2>&1; then
	{
		header python "ruff $(ruff --version | cut -d' ' -f2)"
		ruff rule --all --output-format json | python3 -c 'import json,sys; [print("ruff::"+r["code"]) for r in sorted(json.load(sys.stdin), key=lambda r: r["code"])]'
	} > lint/python/lints-available.txt
	echo "python: $(grep -vc '^#' lint/python/lints-available.txt) lints"
else
	echo "python: skipped, ruff not found"
fi
