#!/bin/bash
# PostCompact hook — re-inject critical context after context compaction

INPUT=$(cat)

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARU_MEMORY="${TARU_MEMORY_DIR:-$HOME/Documents/Taru_Memory}"
SESSION_DIR="$TARU_MEMORY/session_notes/taru"
MEMORY_DIR="$REPO_ROOT/.claude/memory"

PY=""
for cand in py python3 python; do
  if command -v "$cand" >/dev/null 2>&1 && "$cand" --version >/dev/null 2>&1; then
    PY="$cand"; break
  fi
done

echo "=== [Taru PostCompact Recovery] ==="
echo ""

echo "## Core Persona"
echo ""
cat "$REPO_ROOT/CLAUDE.md"
echo ""

for cp in "$TARU_MEMORY/checkpoint.md" "$MEMORY_DIR/checkpoint.md"; do
  if [ -f "$cp" ]; then
    echo "## Checkpoint (recovered — act on this IMMEDIATELY)"
    echo ""
    cat "$cp"
    echo ""
    rm "$cp"
    break
  fi
done

TODAY=$(date +%Y-%m-%d)
if [ -f "$SESSION_DIR/$TODAY.md" ]; then
  echo "## Session Notes ($TODAY)"
  echo ""
  cat "$SESSION_DIR/$TODAY.md"
  echo ""
fi

if [ -f "$MEMORY_DIR/MEMORY.md" ]; then
  echo "## Memory Index"
  echo ""
  cat "$MEMORY_DIR/MEMORY.md"
  echo ""
fi

# Recover last Discord messages (channelId + text) so the agent can resume
# replying after compaction loses that context.
if [ -n "$PY" ]; then
  TRANSCRIPT_PATH=$(echo "$INPUT" | "$PY" -c "import sys,json;print(json.load(sys.stdin).get('transcript_path',''))" 2>/dev/null || echo "")
  if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
    "$PY" - "$TRANSCRIPT_PATH" <<'PY'
import json, re, sys
path = sys.argv[1]
with open(path, encoding='utf-8') as f:
    lines = f.readlines()

pattern = re.compile(
    r'<channel\s+source="taru"[^>]*?channelId="(?P<cid>[^"]+)"[^>]*?messageId="(?P<mid>[^"]+)"[^>]*?timestamp="(?P<ts>[^"]+)"[^>]*>(?P<body>.*?)</channel>',
    re.DOTALL,
)

recent = []
for line in lines:
    try: e = json.loads(line)
    except Exception: continue
    if e.get('type') != 'user': continue
    content = (e.get('message', {}) or {}).get('content', '')
    text = content if isinstance(content, str) else json.dumps(content, ensure_ascii=False)
    for m in pattern.finditer(text):
        recent.append({
            'channelId': m.group('cid'),
            'messageId': m.group('mid'),
            'ts': m.group('ts'),
            'body': m.group('body').strip()[:300],
        })

if recent:
    print('## Recent Discord Messages (latest last — reply via mcp__taru__reply with channelId)')
    print('')
    for r in recent[-5:]:
        print(f"- [{r['ts']}] channel={r['channelId']} msg={r['messageId']}")
        print(f"  > {r['body']}")
    print('')
PY
  fi
fi

echo "=== [PostCompact Recovery Complete] ==="
