#!/usr/bin/env sh
# Audit every git worktree under a multi-repo workspace. Read-only.
#
#   sh audit.sh [workspace-root]        default: the current directory
#
# One line per worktree, with the facts a cleanup decision needs. It reports and never
# deletes, because deciding what is safe to remove needs the branch's remote state, and
# that is a judgement the worktree-cleanup playbook makes.
#
# Columns: repo, worktree, branch, and any flags that apply.
#   dirty      uncommitted changes, so removing it loses work
#   unpushed   commits the remote does not have
#   gone       upstream branch deleted, usually a merged and tidied PR
#   no-upstream never pushed, so nothing tracks it
#   detached   not on a branch
set -eu

root="${1:-$PWD}"
cd "$root" || { echo "no such directory: $root" >&2; exit 1; }

printf '%-22s %-42s %-38s %s\n' REPO WORKTREE BRANCH FLAGS
found=0

for repo in */; do
	repo="${repo%/}"
	[ -d "$repo/.git" ] || continue

	# A worktree's own directory reports the whole set, so only read from the main
	# checkout. Without this every linked worktree reprints its siblings.
	case "$(git -C "$repo" rev-parse --git-dir 2>/dev/null || echo '')" in
		*/worktrees/*) continue ;;
		'') continue ;;
	esac

	git -C "$repo" worktree list --porcelain 2>/dev/null | awk '
		/^worktree /  { path = substr($0, 10) }
		/^branch /    { branch = substr($0, 8); sub("refs/heads/", "", branch) }
		/^detached/   { branch = "(detached)" }
		/^$/          { if (path != "") print path "\t" branch; path = ""; branch = "" }
		END           { if (path != "") print path "\t" branch }
	' | while IFS="$(printf '\t')" read -r path branch; do
		# Skip the main checkout. Only linked worktrees are cleanup candidates.
		[ "$path" = "$PWD/$repo" ] && continue
		[ -d "$path" ] || { printf '%-22s %-42s %-38s %s\n' "$repo" "$(basename "$path")" "-" "missing-dir"; continue; }

		flags=""
		[ -n "$(git -C "$path" status --porcelain 2>/dev/null)" ] && flags="$flags dirty"

		if [ "$branch" = "(detached)" ]; then
			flags="$flags detached"
		else
			# Ask for-each-ref rather than rev-parse. Once the remote branch is deleted and
			# the tracking ref pruned, `rev-parse @{upstream}` exits 128, which is
			# indistinguishable from never having had an upstream. %(upstream:track) says
			# [gone], which is the whole signal cleanup runs on.
			upstream=$(git -C "$path" for-each-ref --format='%(upstream)' "refs/heads/$branch" 2>/dev/null)
			track=$(git -C "$path" for-each-ref --format='%(upstream:track)' "refs/heads/$branch" 2>/dev/null)
			if [ -z "$upstream" ]; then
				flags="$flags no-upstream"
			elif [ "$track" = "[gone]" ]; then
				flags="$flags gone"
			else
				ahead=$(printf '%s' "$track" | sed -n 's/.*ahead \([0-9][0-9]*\).*/\1/p')
				[ -n "$ahead" ] && flags="$flags unpushed:$ahead"
			fi
		fi

		[ -z "$flags" ] && flags=" clean"
		printf '%-22s %-42s %-38s %s\n' "$repo" "$(basename "$path")" "$branch" "${flags# }"
	done
	found=$((found + 1))
done

[ "$found" -eq 0 ] && echo "no git repositories directly under $root" >&2
