#!/bin/bash
# SessionStart hook — load previous session context before first response

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARU_MEMORY="${TARU_MEMORY_DIR:-$HOME/Documents/Taru_Memory}"
SESSION_DIR="$TARU_MEMORY/session_notes/taru"
MEMORY_DIR="$REPO_ROOT/.claude/memory"

echo "=== [Taru Session Startup] ==="
echo ""

mkdir -p "$SESSION_DIR"

echo "## Session Notes"
echo ""
HAS_PENDING=false
for f in $(ls -t "$SESSION_DIR"/*.md 2>/dev/null | head -3); do
  [ -f "$f" ] || continue
  BASENAME=$(basename "$f")
  # Extract the LAST "### Pending" block (append-only notes get multiple; older ones are stale)
  LAST_PENDING=$(awk '
    /^### Pending/ { capturing = 1; block = $0; next }
    capturing {
      if (/^---$/ || /^## / || /^### /) { capturing = 0; next }
      block = block ORS $0
    }
    END { if (block) print block }
  ' "$f")
  # Consider it "has pending" only if the last block contains at least one bullet
  if echo "$LAST_PENDING" | grep -q "^- "; then
    echo "### $BASENAME — HAS PENDING"
    echo "$LAST_PENDING"
    echo ""
    HAS_PENDING=true
  else
    echo "### $BASENAME — no pending items"
  fi
done

if [ "$HAS_PENDING" = true ]; then
  echo "Pending items found above. Address before new work."
  echo ""
fi

if [ -f "$MEMORY_DIR/MEMORY.md" ]; then
  echo "## Memory Index"
  echo ""
  cat "$MEMORY_DIR/MEMORY.md"
  echo ""
fi

echo "=== [Session Startup Complete] ==="
