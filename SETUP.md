# 타루 설치 가이드 (에이전트 실행용)

> **이 파일은 Claude Code가 읽고 순서대로 실행하는 설치 스크립트다.**
> 사람은 "이 레포에서 SETUP.md 보고 타루 셋업해줘"라고만 시키면 된다.
> 사람이 직접 준비할 건 **Discord 봇(토큰·채널 ID)** 하나뿐. 나머지 단계(의존성·환경설정·스킬 설치·검증)는 에이전트가 직접 실행한다.

---

## Prerequisites (사람이 미리 준비)

1. **Claude Code CLI** 설치 및 로그인 완료
2. **Node.js 18+** 설치
3. **Python 3.10+** 설치 (MS Office 스킬 — 문서 생성/편집용)
4. **Discord 봇** 생성 후 아래 두 값 확보 (아래 가이드 참고):
   - `DISCORD_BOT_TOKEN`
   - `DISCORD_HOME_CHANNEL` (봇이 멘션 없이도 듣는 채널 ID)

> macOS / Windows 모두 지원.

---

## Discord 봇 만들기 (사람이 1회)

토큰은 비밀값이라 사람이 직접 발급·입력한다.

1. https://discord.com/developers/applications → **New Application** → 이름 `Taru`
2. 좌측 **Bot** → **Reset Token** → 토큰 복사 (= `DISCORD_BOT_TOKEN`)
3. **Privileged Gateway Intents** 3개 모두 ON:
   - PRESENCE INTENT / SERVER MEMBERS INTENT / **MESSAGE CONTENT INTENT**
4. 좌측 **OAuth2 → URL Generator**
   - Scopes: `bot`
   - Bot Permissions: `Send Messages`, `Read Message History`, `Add Reactions`, `Attach Files`, `Read Messages/View Channels`
   - 생성된 URL을 브라우저에서 열어 서버에 초대
5. Discord 설정 → 고급 → **개발자 모드** ON → 원하는 채널 우클릭 → **채널 ID 복사** (= `DISCORD_HOME_CHANNEL`)

---

## Auto-Setup Steps (에이전트가 실행)

에이전트는 아래를 위에서부터 순서대로 실행한다. 실패하면 해당 단계의 Troubleshooting을 보고 고친 뒤 다음으로 넘어간다.

### Step 1 — 의존성 설치

```bash
cd channels && npm install && cd ..
```

루트 런처 의존성(`node-pty`)도 설치:

```bash
npm install
```

### Step 2 — 환경변수(.env)

```bash
cp .env.example .env
```

`.env`에 사람이 발급한 값을 넣는다. **토큰은 비밀값이므로 사람에게 입력을 요청**하고(예: Discord로 "봇 토큰 알려줘"), 받은 값을 `.env`에 기록한다:

```
DISCORD_BOT_TOKEN=실제토큰
DISCORD_HOME_CHANNEL=실제채널ID
```

> `.env`는 `.gitignore`에 있어 커밋되지 않는다. 절대 레포·로그·메시지에 토큰을 평문 노출하지 말 것.

### Step 3 — Claude Code 권한/훅 설정

훅 등록은 `.claude/settings.json`에 이미 포함돼 있다(clone 시 자동). 권한 설정만 `.claude/settings.local.json`으로 생성한다.

**macOS / Linux:**
```json
{
  "dangerouslySkipPermissions": true
}
```

**Windows:** 훅이 bash 기준이라 PowerShell 오버라이드가 필요하다. `.claude/settings.local.json`을 아래로 생성:
```json
{
  "dangerouslySkipPermissions": true,
  "hooks": {
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "powershell -ExecutionPolicy Bypass -File hooks/session-start.ps1" }] }],
    "PreCompact": [{ "hooks": [{ "type": "command", "command": "powershell -ExecutionPolicy Bypass -File hooks/pre-compact.ps1" }] }],
    "PostCompact": [{ "hooks": [{ "type": "command", "command": "powershell -ExecutionPolicy Bypass -File hooks/post-compact.ps1" }] }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "powershell -ExecutionPolicy Bypass -File hooks/enforce-discord-reply.ps1" }, { "type": "command", "command": "powershell -ExecutionPolicy Bypass -File hooks/stop.ps1" }] }],
    "PostToolUseFailure": [{ "hooks": [{ "type": "command", "command": "powershell -ExecutionPolicy Bypass -File hooks/tool-error.ps1" }] }]
  }
}
```

### Step 4 — 메모리 디렉토리

**macOS / Linux:**
```bash
mkdir -p ~/Documents/Taru_Memory/session_notes/taru
mkdir -p ~/Documents/Taru_Memory/inbox
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Path "$env:USERPROFILE\Documents\Taru_Memory\session_notes\taru" -Force
New-Item -ItemType Directory -Path "$env:USERPROFILE\Documents\Taru_Memory\inbox" -Force
```

### Step 5 — 메모리 인덱스 확인

`.claude/memory/MEMORY.md`가 레포에 이미 있다(빈 템플릿). 없으면 생성:
```markdown
# Taru Memory Index

(빈 상태 — 대화하면서 자동으로 채워짐)
```

### Step 6 — MS Office 스킬 설치 (pptx / docx / xlsx / pdf)

> 이 스킬들은 **Anthropic 공식 자산(Proprietary 라이선스)**이라 타루 레포에 번들로 넣지 않는다. 아래 스크립트가 [공식 레포 `anthropics/skills`](https://github.com/anthropics/skills)에서 직접 받아 `.claude/skills/`에 설치하고, 필요한 Python 패키지까지 깐다. (각 사용자가 본인 Anthropic 약관 하에 설치하는 구조)

**macOS / Linux:**
```bash
bash scripts/install-office-skills.sh
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-office-skills.ps1
```

설치 후 `.claude/skills/`에 `pptx docx xlsx pdf` 4개 디렉토리가 생긴다. 스킬은 **타루 재시작 후** 등록된다.

### Step 7 — 검증

**macOS:** `bash run-taru.sh` / **Windows:** `run-taru.bat`

정상 확인:
- `[Taru Session Startup]` 메시지 출력
- Discord에서 봇이 메시지에 🤔 반응 후 답장
- 세션 노트 생성:
  - macOS: `~/Documents/Taru_Memory/session_notes/taru/YYYY-MM-DD.md`
  - Windows: `%USERPROFILE%\Documents\Taru_Memory\session_notes\taru\YYYY-MM-DD.md`
- Discord에서 "발표자료 3장 만들어줘" → `.pptx` 파일을 만들어 `send_file_to_discord`로 전송하면 Office 스킬까지 정상

---

## Troubleshooting

| 증상 | 원인 | 해결 |
|------|------|------|
| `MODULE_NOT_FOUND` | npm install 미완료 | `cd channels && npm install` |
| Discord 연결 안됨 | 토큰 오류 | `.env`의 `DISCORD_BOT_TOKEN` 재확인 |
| 메시지 감지 안됨 | MESSAGE CONTENT Intent 미활성화 | Developer Portal → Bot → Intent ON |
| 답장 안 함 | 채널 ID 불일치 | `DISCORD_HOME_CHANNEL` 확인, 또는 봇을 멘션 |
| 훅 실행 안됨 | Windows에서 PowerShell 오버라이드 누락 | Step 3 Windows 블록 적용 |
| `/pptx` 등 스킬 안 뜸 | 설치 후 미재시작 | 타루 재시작 (스킬은 세션 시작 때 등록) |
| Office 스킬 설치 실패 | git/Python 누락 | `git --version`, `py --version` 확인 (Python 3.10+) |
| 문서 읽기(`markitdown`) 오류 | Python 3.9 이하 | Python 3.10+ 로 업그레이드 (생성·편집은 3.9에서도 동작) |
| 썸네일/PDF→이미지 실패 | LibreOffice/poppler 없음 | 문서 생성·편집엔 불필요. 필요 시 별도 설치 |
| 세션 노트 에러 | 메모리 디렉토리 없음 | Step 4 재실행 |

---

## 타루를 내 입맛대로 바꾸기

- **성격·말투·역할**: `CLAUDE.md` 수정 (코드 몰라도 자연어로 바꾸면 됨)
- **이름**: `channels/taru-discord.mjs`의 `agentName`/`emoji`, 그리고 메모리 경로(`TARU_MEMORY_DIR`)
- **훅 동작**: `hooks/` 의 셸 스크립트 (`.sh` = mac/Linux, `.ps1` = Windows)
- **새 도구 추가**: `.mcp-taru.json`에 MCP 서버 추가
