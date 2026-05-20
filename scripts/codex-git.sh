#!/data/data/com.termux/files/usr/bin/sh
set -eu

usage() {
  cat <<'EOF'
Usage:
  ./scripts/codex-git.sh c "commit message"
  ./scripts/codex-git.sh p "PR title" "PR body" [base]
  ./scripts/codex-git.sh cp "commit message" "PR title" "PR body" [base]

Short aliases:
  c  = commit staged+unstaged tracked/untracked changes
  p  = create PR from current branch to base (default: main)
  cp = commit then create PR
EOF
}

ensure_git_repo() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
    echo "Error: not inside a git repository."
    exit 1
  }
}

commit_all() {
  msg="${1:-}"
  if [ -z "$msg" ]; then
    echo "Error: missing commit message."
    usage
    exit 1
  fi

  git add -A
  if git diff --cached --quiet; then
    echo "Nothing to commit."
    exit 0
  fi

  git commit -m "$msg"
}

create_pr() {
  title="${1:-}"
  body="${2:-}"
  base="${3:-main}"

  if [ -z "$title" ] || [ -z "$body" ]; then
    echo "Error: missing PR title or body."
    usage
    exit 1
  fi

  branch="$(git branch --show-current)"
  if [ -z "$branch" ]; then
    echo "Error: could not detect current branch."
    exit 1
  fi

  git push -u origin "$branch"
  gh pr create --base "$base" --head "$branch" --title "$title" --body "$body"
}

ensure_git_repo

cmd="${1:-}"
case "$cmd" in
  c)
    shift
    commit_all "${1:-}"
    ;;
  p)
    shift
    create_pr "${1:-}" "${2:-}" "${3:-main}"
    ;;
  cp)
    shift
    commit_all "${1:-}"
    create_pr "${2:-}" "${3:-}" "${4:-main}"
    ;;
  *)
    usage
    exit 1
    ;;
esac
