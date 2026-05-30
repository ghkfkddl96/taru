#!/bin/bash
# Stop hook — if the last user message came from the Discord channel
# (`<channel source="taru" ...>`), require mcp__taru__reply or
# mcp__taru__dismiss to have been called before the turn ends.
# Otherwise exit 2 + stderr so Claude Code blocks the turn end and feeds
# the message back to the agent.

set -e
INPUT=$(cat)

# Prefer `py` on Windows (Git Bash). Windows Store ships a broken `python`/`python3`
# stub that `command -v` finds but that exits non-zero — so verify with --version.
PY=""
for cand in py python3 python; do
  if command -v "$cand" >/dev/null 2>&1 && "$cand" --version >/dev/null 2>&1; then
    PY="$cand"; break
  fi
done
if [ -z "$PY" ]; then
  echo "no python interpreter found for enforce-discord-reply hook" >&2
  exit 0
fi

TRANSCRIPT_PATH=$(echo "$INPUT" | "$PY" -c "import sys,json; print(json.load(sys.stdin).get('transcript_path',''))")
STOP_ACTIVE=$(echo "$INPUT" | "$PY" -c "import sys,json; print(json.load(sys.stdin).get('stop_hook_active', False))")

if [ "$STOP_ACTIVE" = "True" ]; then exit 0; fi
if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then exit 0; fi

"$PY" - "$TRANSCRIPT_PATH" <<'PY'
import json, sys
path = sys.argv[1]
with open(path, encoding='utf-8') as f:
    lines = f.readlines()

last_user_idx = -1
last_user_is_channel = False

COMPACT_MARKERS = (
    'This session is being continued from a previous conversation that ran out of context',
    '<command-name>compact</command-name>',
)

for i, line in enumerate(lines):
    try: e = json.loads(line)
    except Exception: continue
    if e.get('type') != 'user': continue
    msg = e.get('message', {}) or {}
    content = msg.get('content', '')
    if isinstance(content, list):
        if any(isinstance(b, dict) and b.get('type') == 'tool_result' for b in content):
            continue
        text = json.dumps(content, ensure_ascii=False)
    else:
        text = str(content)
    # Skip synthetic compaction-resume user messages — they overwrite the
    # real last Discord user message and cause the hook to exit 0 wrongly.
    if any(m in text for m in COMPACT_MARKERS):
        continue
    last_user_idx = i
    last_user_is_channel = 'channel source="taru"' in text

if last_user_idx < 0 or not last_user_is_channel:
    sys.exit(0)

replied = False
for line in lines[last_user_idx + 1:]:
    try: e = json.loads(line)
    except Exception: continue
    if e.get('type') != 'assistant': continue
    for block in (e.get('message', {}) or {}).get('content', []) or []:
        if (isinstance(block, dict)
            and block.get('type') == 'tool_use'
            and block.get('name') in ('mcp__taru__reply', 'mcp__taru__dismiss')):
            replied = True
            break
    if replied: break

if replied:
    sys.exit(0)

sys.stderr.write(
    "BLOCK: Discord 메시지에 답장/dismiss 없이 턴 종료 불가. "
    "mcp__taru__reply 또는 mcp__taru__dismiss를 호출한 뒤 다시 종료하라.\n"
)
sys.exit(2)
PY
