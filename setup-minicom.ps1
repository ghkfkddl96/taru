<#
  타루 미니컴(GMK NucBox) 원클릭 셋업 — Windows PowerShell에서 실행.
  하는 일: 필수 프로그램 설치 → 코드 받기 → 의존성 설치 → 환경설정(backup 역할)
           → 부팅 자동시작(타루 봇 + 알람 데몬) → 절전 끄기.
  비밀(봇 토큰·KTX·쿠팡 PIN)은 보안상 자동으로 안 옮긴다 → 마지막 안내대로 직접 넣으면 됨.

  실행법: 시작 → "PowerShell" 우클릭 → 관리자 권한으로 실행 → 아래 한 줄 붙여넣기
    Set-ExecutionPolicy -Scope Process Bypass -Force; irm https://raw.githubusercontent.com/ghkfkddl96/taru/main/setup-minicom.ps1 | iex
#>
$ErrorActionPreference = 'Stop'
function Step($m){ Write-Host "`n=== $m ===" -ForegroundColor Cyan }
function Ok($m){ Write-Host "  [OK] $m" -ForegroundColor Green }
function Warn($m){ Write-Host "  [!] $m" -ForegroundColor Yellow }

$REPO = 'https://github.com/ghkfkddl96/taru.git'
$DEST = Join-Path $env:USERPROFILE 'Agent\taru'

Step '1/7 필수 프로그램 설치 (winget)'
$pkgs = @(
  'OpenJS.NodeJS.LTS',
  'Python.Python.3.12',
  'Git.Git',
  'Google.Chrome',
  'Google.GoogleDrive'
)
foreach ($p in $pkgs) {
  try { winget install --id $p -e --silent --accept-package-agreements --accept-source-agreements | Out-Null; Ok $p }
  catch { Warn "$p 설치 건너뜀(이미 있거나 실패): $($_.Exception.Message)" }
}
# 새 PATH 반영
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')

Step '2/7 Claude Code 설치 (npm)'
try { npm install -g @anthropic-ai/claude-code | Out-Null; Ok 'claude code' }
catch { Warn "claude code 설치 실패 — 나중에 'npm i -g @anthropic-ai/claude-code' 수동 실행: $($_.Exception.Message)" }

Step '3/7 타루 코드 받기 (git clone)'
if (Test-Path $DEST) { Warn "$DEST 이미 있음 → git pull"; Push-Location $DEST; git pull; Pop-Location }
else { New-Item -ItemType Directory -Force (Split-Path $DEST) | Out-Null; git clone $REPO $DEST; Ok "clone → $DEST" }

Step '4/7 의존성 설치 (npm / pip / playwright)'
Push-Location $DEST
npm install | Out-Null; Ok 'root npm'
Push-Location (Join-Path $DEST 'channels'); npm install | Out-Null; Pop-Location; Ok 'channels npm'
try { python -m pip install --quiet korail2-ncard pycryptodome; Ok 'KTX 파이썬 패키지' } catch { Warn "pip 실패: $($_.Exception.Message)" }
try { npx --yes playwright install chromium | Out-Null; Ok 'playwright chromium(쿠팡용)' } catch { Warn "playwright 건너뜀: $($_.Exception.Message)" }
Pop-Location

Step '5/7 환경설정 (.env — backup 역할)'
$gdrive = Read-Host '구글드라이브 공유폴더 전체경로 입력 (예: G:\내 드라이브\TaruShared)'
$envPath = Join-Path $DEST '.env'
if (-not (Test-Path $envPath)) {
  $token = Read-Host '디스코드 봇 토큰 붙여넣기 (노트북 .env의 DISCORD_BOT_TOKEN 값)'
  $homeCh = Read-Host '디스코드 채널 ID (노트북 .env의 DISCORD_HOME_CHANNEL 값)'
  @(
    "DISCORD_BOT_TOKEN=$token",
    "DISCORD_HOME_CHANNEL=$homeCh",
    "PYTHONUTF8=1",
    "PYTHONIOENCODING=utf-8",
    "TARU_ROLE=backup",
    "TARU_SHARED_DIR=$gdrive"
  ) | Set-Content -Encoding utf8 $envPath
  Ok '.env 생성(backup)'
} else {
  Warn '.env 이미 있음 → TARU_ROLE/TARU_SHARED_DIR만 추가 확인'
  $c = Get-Content $envPath -Raw
  if ($c -notmatch 'TARU_ROLE')       { Add-Content $envPath "`nTARU_ROLE=backup" }
  if ($c -notmatch 'TARU_SHARED_DIR') { Add-Content $envPath "`nTARU_SHARED_DIR=$gdrive" }
  Ok '.env 갱신'
}

Step '6/7 부팅 자동시작 등록 (타루 봇 + 알람 데몬)'
$node = (Get-Command node).Source
# 타루 봇(run-taru) — 로그온 시 시작
$a1 = New-ScheduledTaskAction -Execute $node -Argument 'run-taru.mjs' -WorkingDirectory $DEST
# 알람 데몬(taru-alarmd) — 미니컴에서만 돈다(노트북 꺼져도 알람 발사)
$a2 = New-ScheduledTaskAction -Execute $node -Argument 'taru-alarmd.mjs' -WorkingDirectory $DEST
$trig = New-ScheduledTaskTrigger -AtLogOn
$set = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)
try {
  Register-ScheduledTask -TaskName 'Taru-Bot' -Action $a1 -Trigger $trig -Settings $set -Force | Out-Null; Ok 'Taru-Bot 자동시작'
  Register-ScheduledTask -TaskName 'Taru-AlarmDaemon' -Action $a2 -Trigger $trig -Settings $set -Force | Out-Null; Ok 'Taru-AlarmDaemon 자동시작'
} catch { Warn "작업 스케줄러 등록 실패(관리자 권한 필요): $($_.Exception.Message)" }

Step '7/7 절전 끄기 (모니터 없이 24시간)'
try {
  powercfg /change standby-timeout-ac 0
  powercfg /change monitor-timeout-ac 0
  powercfg /change hibernate-timeout-ac 0
  Ok '절전/최대절전 해제'
} catch { Warn "powercfg 실패: $($_.Exception.Message)" }

Write-Host "`n========== 설치 끝! 남은 수동 단계 ==========" -ForegroundColor Cyan
Write-Host @"
1) 구글드라이브 로그인 → 노트북과 '같은 공유폴더'($gdrive)가 동기화되는지 확인
2) KTX 쓸 거면: $env:USERPROFILE\.config\k-skill\secrets.env 에
     KSKILL_KTX_ID / KSKILL_KTX_PASSWORD 입력 (노트북에서 복사 or 재입력)
3) 쿠팡 자동구매 쓸 거면: 미니컴에서 쿠팡 재로그인 + 결제PIN 재등록(보안상 기기마다 따로)
4) Claude Code 로그인: 명령창에서  claude  한번 실행해 Anthropic 계정 로그인
5) 윈도우 자동로그인(부팅 시 비번 없이): netplwiz 실행 → 사용자 선택 → '암호 입력' 체크 해제
6) 재부팅하면 끝. 노트북 꺼져 있을 때 디코로 말 걸어 미니컴이 답하는지 테스트.

※ 노트북은 TARU_ROLE=primary (또는 미설정), 미니컴은 TARU_ROLE=backup 이어야 함.
※ 알람 데몬(Taru-AlarmDaemon)은 미니컴에서만 돌린다. 노트북엔 등록하지 말 것.
"@ -ForegroundColor Gray
