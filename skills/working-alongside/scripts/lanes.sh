#!/usr/bin/env sh
# Report the units of work other sessions have announced in a workspace. Read-only.
#
#   sh lanes.sh [workspace-root]        default: the current directory
#
# The board is <workspace>/.thiamine/lanes/, one file per unit, written only by the session
# that owns it. This reads them and says how old each one is. It reports and never deletes,
# because a stale entry may belong to a session that is alive and slow, and being wrong
# about that costs somebody their work.
#
# For what is on disk rather than what was announced, use the audit script in
# land-a-change. This answers who is on it; that one answers what exists.
set -eu

root="${1:-$PWD}"
dir="$root/.thiamine/lanes"
STALE_HOURS=4

[ -d "$dir" ] || { echo "no board at $dir (nothing announced in this workspace)"; exit 0; }

# ISO8601 to epoch. GNU date and BSD date disagree, and both are common.
epoch() {
	date -u -d "$1" +%s 2>/dev/null || date -j -u -f '%Y-%m-%dT%H:%M:%SZ' "$1" +%s 2>/dev/null || echo ''
}

# Leading whitespace is tolerated because an entry pasted out of an indented code block
# is the common case, and anchoring hard on ^ made every field read as empty.
field() { sed -n "s/^[[:space:]]*$2:[[:space:]]*//p" "$1" | head -1; }

now=$(date -u +%s)
found=0

printf '%-28s %-18s %-7s %s\n' UNIT SESSION SEEN FLAGS
for file in "$dir"/*; do
	[ -f "$file" ] || continue
	found=$((found + 1))

	unit=$(field "$file" unit); unit="${unit:-$(basename "$file")}"
	session=$(field "$file" session)
	beat=$(field "$file" heartbeat)
	waiting=$(field "$file" waiting-on)

	flags=""
	seen="?"
	if [ -n "$beat" ] && stamp=$(epoch "$beat") && [ -n "$stamp" ]; then
		hours=$(( (now - stamp) / 3600 ))
		seen="${hours}h"
		[ "$hours" -ge "$STALE_HOURS" ] && flags="$flags stale"
	else
		flags="$flags no-heartbeat"
	fi
	[ -n "$waiting" ] && flags="$flags waiting"

	printf '%-28s %-18s %-7s %s\n' "$unit" "${session:-unknown}" "$seen" "${flags# }"

	for key in goal repos paths decides; do
		val=$(field "$file" "$key")
		[ -n "$val" ] && printf '    %-8s %s\n' "$key" "$val"
	done
done

[ "$found" -eq 0 ] && echo "board exists but is empty"
echo
echo "stale means the owner has not touched the entry in ${STALE_HOURS}h. It is not permission to remove it."
