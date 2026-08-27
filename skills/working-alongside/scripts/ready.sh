#!/usr/bin/env sh
# Evaluate the predicates on units of work that are waiting, and say which can now start.
#
#   sh ready.sh [workspace-root]        default: the current directory
#
# A waiting unit carries a `waiting-on:` line holding a shell command that exits 0 when the
# thing it waits for has happened. This runs each one and reports. It changes nothing in the
# board and starts nothing.
#
# It executes those lines, so a predicate is code. Keep them read-only checks against git,
# the remote, or the filesystem, which is all a predicate needs to be.
set -eu

root="${1:-$PWD}"
dir="$root/.thiamine/lanes"
OVERDUE_HOURS=24

[ -d "$dir" ] || { echo "no board at $dir (nothing waiting in this workspace)"; exit 0; }

epoch() {
	date -u -d "$1" +%s 2>/dev/null || date -j -u -f '%Y-%m-%dT%H:%M:%SZ' "$1" +%s 2>/dev/null || echo ''
}

# Leading whitespace is tolerated because an entry pasted out of an indented code block
# is the common case, and anchoring hard on ^ made every field read as empty.
field() { sed -n "s/^[[:space:]]*$2:[[:space:]]*//p" "$1" | head -1; }

now=$(date -u +%s)
waiting=0

for file in "$dir"/*; do
	[ -f "$file" ] || continue
	predicate=$(field "$file" waiting-on)
	[ -n "$predicate" ] || continue
	waiting=$((waiting + 1))

	unit=$(field "$file" unit); unit="${unit:-$(basename "$file")}"

	if (cd "$root" && sh -c "$predicate") >/dev/null 2>&1; then
		state="READY"
	else
		state="blocked"
	fi

	note=""
	since=$(field "$file" started)
	if [ -n "$since" ] && stamp=$(epoch "$since") && [ -n "$stamp" ]; then
		hours=$(( (now - stamp) / 3600 ))
		note="waiting ${hours}h"
		[ "$hours" -ge "$OVERDUE_HOURS" ] && note="$note OVERDUE"
	fi

	printf '%-8s %-28s %s\n' "$state" "$unit" "$note"
	printf '         %s\n' "$predicate"
done

[ "$waiting" -eq 0 ] && echo "nothing is waiting on a predicate"
echo
echo "READY means the predicate passed. Re-check the overlap before starting: the world moved while you waited."
echo "OVERDUE means it has waited over ${OVERDUE_HOURS}h. Surface it rather than keep waiting."
