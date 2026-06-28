#!/bin/bash
# Generates/updates uncommitted-files.md checklist from git status.
# Compatible with bash 3.x (macOS) and bash 4+ (Linux).
# Usage: ./scripts/uncommitted-files.sh

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
CHECKLIST="$REPO_ROOT/uncommitted-files.md"

GIT_FILES="$(mktemp)"
UNCHECKED="$(mktemp)"
MERGED="$(mktemp)"
trap 'rm -f "$GIT_FILES" "$UNCHECKED" "$MERGED"' EXIT

# Step 1: Collect files from git status (exclude the checklist itself)
git status --porcelain | awk '{print $NF}' | grep -v '^uncommitted-files.md$' | sort > "$GIT_FILES"

if [[ ! -s "$GIT_FILES" ]]; then
  echo "No uncommitted or untracked files found."
  [[ -f "$CHECKLIST" ]] && rm "$CHECKLIST"
  exit 0
fi

# Step 2: Parse existing checklist — extract unchecked file paths
if [[ -f "$CHECKLIST" ]]; then
  # Strip optional "N. " prefix, keep only "[ ] path" lines, extract path
  sed -n 's/^[0-9]*\.\{0,1\} *\[ \] \(.*\)$/\1/p' "$CHECKLIST" | sort > "$UNCHECKED"
else
  : > "$UNCHECKED"
fi

# Step 3: Build merged list
#   - existing unchecked items still in git status (intersection)
#   - new files from git status not in existing checklist
comm -12 "$UNCHECKED" "$GIT_FILES" > "$MERGED"
comm -23 "$GIT_FILES" "$UNCHECKED" >> "$MERGED"
sort -o "$MERGED" "$MERGED"

# Step 4: Write numbered checklist
counter=1
while IFS= read -r file; do
  echo "$counter. [ ] $file"
  counter=$((counter + 1))
done < "$MERGED" > "$CHECKLIST"

# Step 5: Verify — re-check git status against written file
VERIFY="$(mktemp)"
trap 'rm -f "$GIT_FILES" "$UNCHECKED" "$MERGED" "$VERIFY"' EXIT
git status --porcelain | awk '{print $NF}' | grep -v '^uncommitted-files.md$' | sort > "$VERIFY"

missing_count=0
while IFS= read -r file; do
  if ! grep -qF "[ ] $file" "$CHECKLIST"; then
    last_num=$(tail -1 "$CHECKLIST" | grep -oE '^[0-9]+')
    last_num=$((last_num + 1))
    echo "$last_num. [ ] $file" >> "$CHECKLIST"
    missing_count=$((missing_count + 1))
  fi
done < "$VERIFY"

if [[ $missing_count -gt 0 ]]; then
  echo "Added $missing_count missing file(s) during verification."
fi

total=$((counter - 1))
echo "Done. $total file(s) written to uncommitted-files.md"
