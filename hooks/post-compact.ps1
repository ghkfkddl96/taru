# PostCompact hook — re-inject critical context after context compaction

$inputRaw = [Console]::In.ReadToEnd()
$transcript = $null
if ($inputRaw) {
    try { $transcript = ($inputRaw | ConvertFrom-Json).transcript_path } catch { $transcript = $null }
}

$RepoRoot = Split-Path -Parent $PSScriptRoot
$TaruMemory = if ($env:TARU_MEMORY_DIR) { $env:TARU_MEMORY_DIR } else { "$env:USERPROFILE\Documents\Taru_Memory" }
$SessionDir = "$TaruMemory\session_notes\taru"
$MemoryDir = "$RepoRoot\.claude\memory"

$py = if (Get-Command py -ErrorAction SilentlyContinue) { 'py' }
      elseif (Get-Command python3 -ErrorAction SilentlyContinue) { 'python3' }
      else { 'python' }

Write-Output "=== [Taru PostCompact Recovery] ==="
Write-Output ""

Write-Output "## Core Persona"
Write-Output ""
Get-Content "$RepoRoot\CLAUDE.md"
Write-Output ""

$checkpointPaths = @("$TaruMemory\checkpoint.md", "$MemoryDir\checkpoint.md")
foreach ($cp in $checkpointPaths) {
    if (Test-Path $cp) {
        Write-Output "## Checkpoint (recovered --- act on this IMMEDIATELY)"
        Write-Output ""
        Get-Content $cp
        Write-Output ""
        Remove-Item $cp
        break
    }
}

$today = Get-Date -Format "yyyy-MM-dd"
$todayFile = "$SessionDir\$today.md"
if (Test-Path $todayFile) {
    Write-Output "## Session Notes ($today)"
    Write-Output ""
    Get-Content $todayFile
    Write-Output ""
}

if (Test-Path "$MemoryDir\MEMORY.md") {
    Write-Output "## Memory Index"
    Write-Output ""
    Get-Content "$MemoryDir\MEMORY.md"
    Write-Output ""
}

if ($transcript -and (Test-Path $transcript)) {
    $script = @'
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
    print('## Recent Discord Messages (latest last --- reply via mcp__taru__reply with channelId)')
    print('')
    for r in recent[-5:]:
        print(f"- [{r['ts']}] channel={r['channelId']} msg={r['messageId']}")
        print(f"  > {r['body']}")
    print('')
'@
    & $py -c $script $transcript
}

Write-Output "=== [PostCompact Recovery Complete] ==="
