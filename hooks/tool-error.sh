#!/bin/bash
# PostToolUseFailure hook — track consecutive tool errors, warn on diminishing returns

AGENT_NAME="taru"
ERROR_FILE="/tmp/${AGENT_NAME}_consecutive_errors"

COUNT=$(($(cat "$ERROR_FILE" 2>/dev/null || echo 0) + 1))
echo "$COUNT" > "$ERROR_FILE"

if [ "$COUNT" -ge 3 ]; then
  echo ""
  echo "⚠️ ${COUNT}회 연속 도구 에러. 같은 접근을 반복하고 있을 수 있음."
  echo "다른 방법을 시도하거나 문제를 재분석할 것."
  echo ""
fi
