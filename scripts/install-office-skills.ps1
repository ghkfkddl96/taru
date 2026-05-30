# Taru — MS Office 스킬 설치 (pptx / docx / xlsx / pdf)  [Windows PowerShell]
#
# 이 스킬들은 Anthropic 공식 레포(anthropics/skills)의 자산이며 Proprietary
# 라이선스다. Taru 레포에 번들로 포함하지 않고, 각 사용자가 본인 Anthropic
# 이용약관 하에 공식 소스에서 직접 받아 로컬에 설치한다.
#
# 사용법:
#   powershell -ExecutionPolicy Bypass -File scripts\install-office-skills.ps1

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$Dst = Join-Path $RepoRoot '.claude\skills'
$Tmp = Join-Path $RepoRoot '.cache\skills-src'
$Skills = @('pptx', 'docx', 'xlsx', 'pdf')

Write-Host "=== [Taru] MS Office 스킬 설치 ==="

# --- python 탐색 (py 우선) ---
$Py = $null
foreach ($cand in @('py', 'python3', 'python')) {
  $cmd = Get-Command $cand -ErrorAction SilentlyContinue
  if ($cmd) {
    try { & $cand --version *> $null; if ($LASTEXITCODE -eq 0) { $Py = $cand; break } } catch {}
  }
}
if (-not $Py) {
  Write-Error "Python 인터프리터를 찾지 못함. Python 3.10+ 설치 후 다시 실행."
  exit 1
}
Write-Host "python: $(& $Py --version 2>&1)"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "git 이 필요함."
  exit 1
}

# --- 1) sparse clone ---
Write-Host "→ anthropics/skills sparse clone..."
if (Test-Path $Tmp) { Remove-Item -Recurse -Force $Tmp }
git clone --depth 1 --filter=blob:none --sparse https://github.com/anthropics/skills $Tmp *> $null
$sparseArgs = $Skills | ForEach-Object { "skills/$_" }
git -C $Tmp sparse-checkout set @sparseArgs *> $null

# --- 2) 복사 ---
if (-not (Test-Path $Dst)) { New-Item -ItemType Directory -Path $Dst -Force | Out-Null }
foreach ($s in $Skills) {
  $srcDir = Join-Path $Tmp "skills\$s"
  if (Test-Path $srcDir) {
    $dstDir = Join-Path $Dst $s
    if (Test-Path $dstDir) { Remove-Item -Recurse -Force $dstDir }
    Copy-Item -Recurse $srcDir $dstDir
    Write-Host "  installed: $s"
  } else {
    Write-Warning "skills/$s 를 찾지 못함 (레포 구조 변경?)"
  }
}
Remove-Item -Recurse -Force $Tmp

# --- 3) Python 의존성 ---
Write-Host "→ Python 의존성 설치..."
& $Py -m pip install --quiet --upgrade `
  python-pptx python-docx openpyxl lxml defusedxml Pillow pypdf pdfplumber markitdown
if ($LASTEXITCODE -ne 0) { Write-Warning "일부 패키지 설치 실패. pip 로그 확인." }

Write-Host ""
Write-Host "설치된 스킬:"
Get-ChildItem $Dst -Directory | ForEach-Object { Write-Host "  - $($_.Name)" }
Write-Host ""
Write-Host "=== 완료. 타루 재시작하면 /pptx /docx /xlsx /pdf 사용 가능 ==="
Write-Host "참고: 썸네일/PDF→이미지 변환은 LibreOffice/poppler 가 추가로 필요할 수 있음."
Write-Host "      문서 생성·편집은 위 Python 패키지만으로 동작."
