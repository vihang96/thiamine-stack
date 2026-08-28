#!/usr/bin/env sh
# Pull request state for a branch across a multi-repo workspace. Read-only.
#
#   sh pr-status.sh <branch> [workspace-root]
#   sh pr-status.sh --stack <branch> [workspace-root]
#
# Default mode reports the branch in every repo that has it, because a change spans repos
# and its readiness is the worst state among them.
#
# --stack walks down from the branch through each pull request's base until it reaches the
# default branch, and prints the chain bottom first. That order is the order a stack has to
# land in, and it is the only way to see which pull request is blocking the rest.
#
# Columns: repo, PR, base, state, review, checks, mergeable. Failing checks are named
# underneath, because the name is the only part you can act on.
set -eu

stack=0
if [ "${1:-}" = "--stack" ]; then stack=1; shift; fi
branch="${1:-}"
[ -n "$branch" ] || { echo "usage: pr-status.sh [--stack] <branch> [workspace-root]" >&2; exit 1; }
root="${2:-$PWD}"
cd "$root" || { echo "no such directory: $root" >&2; exit 1; }
command -v gh >/dev/null || { echo "gh is not installed" >&2; exit 1; }

printf '%-20s %-6s %-26s %-7s %-17s %-8s %s\n' REPO PR BASE STATE REVIEW CHECKS MERGEABLE
found=0

for repo in */; do
	repo="${repo%/}"
	[ -d "$repo/.git" ] || continue
	case "$(git -C "$repo" rev-parse --git-dir 2>/dev/null || echo '')" in
		*/worktrees/*|'') continue ;;
	esac
	git -C "$repo" show-ref --verify --quiet "refs/heads/$branch" 2>/dev/null || continue
	found=$((found + 1))

	( cd "$repo" && REPO="$repo" BRANCH="$branch" STACK="$stack" python3 -c '
import json, os, subprocess, sys

FIELDS = "number,state,reviewDecision,mergeable,baseRefName,statusCheckRollup"
PASSING = ("SUCCESS", "NEUTRAL", "SKIPPED")
repo, branch, stack = os.environ["REPO"], os.environ["BRANCH"], os.environ["STACK"] == "1"


def pr(ref):
    out = subprocess.run(["gh", "pr", "view", ref, "--json", FIELDS],
                         capture_output=True, text=True)
    return json.loads(out.stdout) if out.returncode == 0 and out.stdout.strip() else None


def row(d):
    runs = d.get("statusCheckRollup") or []
    done = [c for c in runs if (c.get("conclusion") or c.get("state"))]
    ok = [c for c in done if (c.get("conclusion") or c.get("state")) in PASSING]
    print("%-20s %-6s %-26s %-7s %-17s %-8s %s" % (
        repo, d.get("number", "-"), d.get("baseRefName", "-"), d.get("state", "-"),
        d.get("reviewDecision") or "-", f"{len(ok)}/{len(done)}" if done else "none",
        d.get("mergeable", "-")))
    for c in done:
        if (c.get("conclusion") or c.get("state")) not in PASSING:
            print("    failing: %s  %s" % (c.get("name", "?"), c.get("detailsUrl", "")))


head = pr(branch)
if head is None:
    print("%-20s %-6s %-26s %-7s %-17s %-8s %s" % (repo, "-", "-", "no-pr", "-", "-", "-"))
    sys.exit(0)

if not stack:
    row(head)
    sys.exit(0)

# Walk down through the bases. A cycle would hang, so cap and dedupe.
chain, seen = [head], {branch}
current = head
while len(chain) < 25:
    base = current.get("baseRefName")
    if not base or base in seen:
        break
    seen.add(base)
    parent = pr(base)
    if parent is None:
        break
    chain.append(parent)
    current = parent

for d in reversed(chain):
    row(d)
' ) || true
done

[ "$found" -eq 0 ] && echo "no repo under $root has a branch named $branch" >&2
exit 0
