#!/usr/bin/env sh
# Summarise several lanes' work for a coherence review, without printing the diffs.
# Read-only.
#
#   sh union.sh <worktree> [<worktree> ...]
#
# Per lane: the repo, the branch, a shortstat, the files it touched, and the symbols it
# introduced. That is what a coherence pass needs. It answers "did two lanes add the same
# thing, or answer one question two ways", and the diffs themselves are the bulk that makes
# reading N lanes impossible in one context.
#
# Each lane is compared against its own merge base with the remote default branch, so a
# lane that is behind is not reported as having deleted what it never had.
set -eu

[ "$#" -gt 0 ] || { echo "usage: sh union.sh <worktree> [<worktree> ...]" >&2; exit 2; }

# The remote default branch, whatever it is called here. origin/HEAD is unset in a fresh
# clone often enough that guessing after it is worth the two extra lines.
base_ref() {
	for ref in origin/HEAD origin/main origin/master; do
		if git -C "$1" rev-parse --verify --quiet "$ref" >/dev/null; then
			echo "$ref"
			return 0
		fi
	done
	return 1
}

# Definitions on added lines. Not a parser: it is a list of the shapes a new name takes in
# the languages this stack covers, which is enough to spot two lanes adding one helper.
new_symbols() {
	git -C "$1" diff -U0 "$2...HEAD" 2>/dev/null |
		grep '^+' | grep -v '^+++' | sed 's/^+//' |
		sed -En \
			-e 's/^[[:space:]]*(export[[:space:]]+)?(default[[:space:]]+)?(async[[:space:]]+)?function[[:space:]]+([A-Za-z_][A-Za-z0-9_]*).*/\4/p' \
			-e 's/^[[:space:]]*(export[[:space:]]+)?(abstract[[:space:]]+)?class[[:space:]]+([A-Za-z_][A-Za-z0-9_]*).*/\3/p' \
			-e 's/^[[:space:]]*(export[[:space:]]+)?(interface|type|enum|namespace)[[:space:]]+([A-Za-z_][A-Za-z0-9_]*).*/\3/p' \
			-e 's/^[[:space:]]*(export[[:space:]]+)?(const|let|var)[[:space:]]+([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*[:=].*/\3/p' \
			-e 's/^[[:space:]]*(async[[:space:]]+)?def[[:space:]]+([A-Za-z_][A-Za-z0-9_]*).*/\2/p' \
			-e 's/^[[:space:]]*(pub[[:space:]]+(\([^)]*\)[[:space:]]+)?)?(async[[:space:]]+)?fn[[:space:]]+([A-Za-z_][A-Za-z0-9_]*).*/\4/p' \
			-e 's/^[[:space:]]*(pub[[:space:]]+(\([^)]*\)[[:space:]]+)?)?(struct|enum|trait|union)[[:space:]]+([A-Za-z_][A-Za-z0-9_]*).*/\4/p' |
		sort -u
}

for path in "$@"; do
	if ! git -C "$path" rev-parse --git-dir >/dev/null 2>&1; then
		echo "== $path"
		echo "   not a git worktree"
		continue
	fi

	# A linked worktree's toplevel is the worktree, so identity comes from the common git
	# dir. Otherwise every lane reports its own branch name as the repo it is in.
	common=$(cd "$path" && cd "$(git rev-parse --git-common-dir)" && pwd)
	repo=$(basename "$(dirname "$common")")
	branch=$(git -C "$path" rev-parse --abbrev-ref HEAD)

	if ! ref=$(base_ref "$path"); then
		echo "== $repo  ($branch)"
		echo "   no remote default branch to compare against"
		continue
	fi
	base=$(git -C "$path" merge-base "$ref" HEAD)

	echo "== $repo  ($branch)  vs $ref"
	stat=$(git -C "$path" diff --shortstat "$base...HEAD")
	echo "   ${stat:-no committed changes}"

	files=$(git -C "$path" diff --name-status "$base...HEAD")
	if [ -n "$files" ]; then
		echo "   files:"
		echo "$files" | sed 's/^/     /'
	fi

	syms=$(new_symbols "$path" "$base")
	if [ -n "$syms" ]; then
		echo "   new names:"
		echo "$syms" | tr '\n' ' ' | fold -s -w 76 | sed 's/^/     /'
		echo
	fi

	dirty=$(git -C "$path" status --porcelain)
	[ -n "$dirty" ] && echo "   uncommitted: $(echo "$dirty" | wc -l | tr -d ' ') file(s) not in the summary above"
done

# Without this the status is that last test, so a run whose final worktree happened to be
# clean reported failure.
exit 0
