#!/bin/bash
# Stop hook — mark session end in today's notes

TARU_MEMORY="${TARU_MEMORY_DIR:-$HOME/Documents/Taru_Memory}"
SESSION_DIR="$TARU_MEMORY/session_notes/taru"
TODAY=$(date +%Y-%m-%d)
SESSION_FILE="$SESSION_DIR/$TODAY.md"

if [ -f "$SESSION_FILE" ]; then
  echo "" >> "$SESSION_FILE"
  echo "---" >> "$SESSION_FILE"
  echo "_Session ended: $(date '+%H:%M')_" >> "$SESSION_FILE"
fi
