#!/bin/bash
# PreCompact hook — force checkpoint write before context compression

TARU_MEMORY="${TARU_MEMORY_DIR:-$HOME/Documents/Taru_Memory}"
CHECKPOINT="$TARU_MEMORY/checkpoint.md"

echo "=== [Taru PreCompact] ==="
echo ""
echo "Context compaction imminent."
echo ""

if [ -f "$CHECKPOINT" ]; then
  echo "## Previous Checkpoint (stale — overwrite)"
  cat "$CHECKPOINT"
  echo ""
fi

echo "MANDATORY: Write checkpoint BEFORE any other response."
echo "Path: $CHECKPOINT"
echo ""
echo "Format:"
echo '```'
echo "# Checkpoint — $(date '+%Y-%m-%d %H:%M')"
echo "## Active Task"
echo "{what you are currently doing}"
echo "## Working State"
echo "{key decisions made, files modified, blockers}"
echo "## Next Step"
echo "{immediate next action after recovery}"
echo '```'
echo ""
echo "=== [Write checkpoint FIRST, then continue] ==="
