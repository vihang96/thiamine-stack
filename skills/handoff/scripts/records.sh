#!/usr/bin/env sh
# Report the handoff records in a workspace and whether their work still exists. Read-only.
#
#   sh records.sh [workspace-root]      default: the current directory
#
# A record is supposed to die with its branch and nothing makes that happen, so the next
# "catch me up" reads a merged one as current. Reports and never deletes, because a record
# whose branch is gone may hold the only copy of a decision. prune-the-record.md decides.
#
# Columns: the record, its age in days, its log entry count, and the state of its branch.
#   live       a matching branch exists and is not merged
#   merged     its commits are reachable from the default branch
#   default    the record is against a default branch, the long-lived kind
#   no-branch  nothing matches, so the change it described is gone
set -eu

root="${1:-$PWD}"
cd "$root" || { echo "no such directory: $root" >&2; exit 1; }

# The filename flattens the branch's slashes, so match the other way. Flatten every branch
# that exists, rather than guessing which slash docs-gradient-measured lost.
flatten() { printf '%s' "$1" | tr '/' '-'; }

mtime() { date -u -r "$1" +%s 2>/dev/null || stat -c %Y "$1"; }

match_branch() {
	git -C "$2" for-each-ref --format='%(refname:short)' refs/heads 2>/dev/null | while read -r b; do
		if [ "$(flatten "$b")" = "$1" ]; then
			printf '%s' "$b"
			break
		fi
	done
}

repos=""
for dir in */; do
	dir="${dir%/}"
	if [ -d "$dir/.git" ]; then
		repos="$repos $dir"
	fi
done
# A single checkout is a workspace of one. Without this, a repo holding its own record
# reports it as no-branch.
if [ -z "$repos" ] && [ -e .git ]; then
	repos=" ."
fi

now=$(date -u +%s)
found=0

printf '%-44s %-5s %-4s %s\n' RECORD AGE LOG STATE

for file in .handoff-*.md; do
	[ -f "$file" ] || continue
	found=$((found + 1))

	slug="${file#.handoff-}"
	slug="${slug%.md}"
	log=$(grep -c '^- ' "$file" || true)
	age="$(( (now - $(mtime "$file")) / 86400 ))d"

	state="no-branch"
	for repo in $repos; do
		branch=$(match_branch "$slug" "$repo")
		if [ -z "$branch" ]; then
			continue
		fi

		default=$(git -C "$repo" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
		default="${default:-main}"

		if [ "$branch" = "$default" ]; then
			state="default"
		elif git -C "$repo" merge-base --is-ancestor "$branch" "origin/$default" 2>/dev/null; then
			state="merged"
		else
			state="live"
		fi
		if [ "$repo" != "." ]; then
			state="$state ($repo/$branch)"
		fi
		break
	done

	printf '%-44s %-5s %-4s %s\n' "$file" "$age" "$log" "$state"
done

# No records is a real answer, the call pr-status.sh makes. The explicit exit matters.
# Without it the status is the last test's, which is how a successful audit returned 1 once.
if [ "$found" -eq 0 ]; then
	echo "no handoff records under $root"
fi

exit 0
