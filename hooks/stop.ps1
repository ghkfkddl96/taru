# Stop hook — mark session end in today's notes

$TaruMemory = if ($env:TARU_MEMORY_DIR) { $env:TARU_MEMORY_DIR } else { "$env:USERPROFILE\Documents\Taru_Memory" }
$SessionDir = "$TaruMemory\session_notes\taru"
$today = Get-Date -Format "yyyy-MM-dd"
$SessionFile = "$SessionDir\$today.md"

if (Test-Path $SessionFile) {
    $now = Get-Date -Format "HH:mm"
    Add-Content $SessionFile ""
    Add-Content $SessionFile "---"
    Add-Content $SessionFile "_Session ended: ${now}_"
}
