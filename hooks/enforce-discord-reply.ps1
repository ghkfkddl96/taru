# Stop hook — enforce Discord reply/dismiss (PowerShell variant of enforce-discord-reply.sh)
$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
try {
  $reader = New-Object System.IO.StreamReader([Console]::OpenStandardInput(), [System.Text.Encoding]::UTF8)
  $inputRaw = $reader.ReadToEnd(); $reader.Close()
  $data = $inputRaw | ConvertFrom-Json
} catch { exit 0 }

if ($data.stop_hook_active) { exit 0 }
$transcript = $data.transcript_path
if (-not $transcript -or -not (Test-Path $transcript)) { exit 0 }

$py = if (Get-Command py -ErrorAction SilentlyContinue) { 'py' }
      elseif (Get-Command python3 -ErrorAction SilentlyContinue) { 'python3' }
      else { 'python' }

$script = @'
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
'@

& $py -c $script $transcript
exit $LASTEXITCODE
