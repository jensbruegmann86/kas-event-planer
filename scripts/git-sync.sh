#!/usr/bin/env bash
set -euo pipefail

msg="${1:-chore: sync changes}"

# Stage all changes in the repository.
git add -A

# Avoid empty commits.
if git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

git commit -m "$msg"
git push -u origin main

echo "Sync complete."
