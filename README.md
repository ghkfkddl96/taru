# 타루 (Taru)

비개발자를 위한 **개인 범용 AI 비서**. Discord로 대화하며 문서 작성·자료 조사·글쓰기·정리를 대신 해준다. macOS / Windows 지원.

> 문서(PPT·워드·엑셀·PDF) 만들기, 검색·요약, 번역, 일정·할일 정리 — 컴퓨터로 하는 귀찮은 일을 Discord 메시지 한 줄로 끝낸다.

---

## 무엇을 할 수 있나

| 분류 | 예시 |
|---|---|
| 📄 문서 만들기 | "이 내용으로 발표자료 10장 만들어줘" → `.pptx` / 보고서 → `.docx` / 표·계산 → `.xlsx` / `.pdf` |
| 🔎 리서치 | "이 제품 3개 비교표 만들어줘", "이 기사 요약해줘" |
| ✍️ 글쓰기 | 이메일·공지 초안, 번역, 맞춤법 교정 |
| 🗂️ 정리·계획 | 할일 목록, 회의록 정리, 여행 계획 |
| 📎 파일 | Discord로 보낸 PDF·이미지·문서 읽고 요약·변환 |

## 요구사항

- macOS 또는 Windows 10+
- [Claude Code CLI](https://claude.ai/code) 설치 및 로그인
- Node.js 18+
- Python 3.10+ (MS Office 스킬용 — 문서 생성/편집)
- Discord 봇 (무료, 5분이면 생성 — `SETUP.md` 참고)

## 빠른 시작

```bash
git clone <repo-url> taru
cd taru

# 1) 의존성 설치
cd channels && npm install && cd ..

# 2) 환경변수
cp .env.example .env
#   .env 편집: DISCORD_BOT_TOKEN, DISCORD_HOME_CHANNEL 입력

# 3) MS Office 스킬 설치 (pptx/docx/xlsx/pdf)
#   macOS / Linux:
bash scripts/install-office-skills.sh
#   Windows:
#   powershell -ExecutionPolicy Bypass -File scripts\install-office-skills.ps1

# 4) 실행
#   macOS:    bash run-taru.sh
#   Windows:  run-taru.bat
```

> 처음이면 `SETUP.md`를 그대로 따라 하면 된다. Claude Code에게 "SETUP.md 보고 셋업해줘"라고 시켜도 된다.

## 핵심 구성

타루는 **5개 부품의 조립**이다 — 거의 코드를 안 짜고 설정·자연어·셸 스크립트로 행동을 정의한다.

| 부품 | 파일 | 역할 |
|---|---|---|
| 인격 | `CLAUDE.md` | 타루가 누구이고 어떻게 행동하는지 (항상 로드) |
| 도구(채널) | `.mcp-taru.json` + `channels/` | Discord로 듣고 답하기 |
| 문서 스킬 | `.claude/skills/` | pptx·docx·xlsx·pdf (설치 스크립트로 추가) |
| 자동화 | `hooks/` | 세션 시작/종료·기억·답장 강제 등 라이프사이클 훅 |
| 기억 | `~/Documents/Taru_Memory/` | 세션 노트·메모리·체크포인트 |

## 디렉토리 구조

```
taru/
├── CLAUDE.md                # 페르소나 (항상 로드)
├── README.md                # 이 파일
├── SETUP.md                 # 설치 가이드 (단계별)
├── run-taru.sh / .bat       # 실행 래퍼 (크래시 시 자동 재시작)
├── run-taru.mjs             # 런처 본체
├── wezterm.lua              # (Windows) 한글 렌더 안정화용 터미널 설정 (선택)
├── .mcp-taru.json           # MCP 서버 설정 (Discord)
├── .env.example             # 환경변수 템플릿
├── channels/
│   ├── discord-channel.mjs  # Discord MCP 서버 코어
│   └── taru-discord.mjs     # 타루 설정 (이름/말투/메모리)
├── hooks/                   # 라이프사이클 훅 (.sh + .ps1)
├── scripts/
│   └── install-office-skills.sh / .ps1   # MS Office 스킬 설치기
└── .claude/
    ├── settings.json        # 훅 등록
    └── memory/MEMORY.md     # 메모리 인덱스
```

## 메모리 구조

```
~/Documents/Taru_Memory/
├── session_notes/taru/   # 세션 노트 (YYYY-MM-DD.md)
├── inbox/                # Discord 첨부파일 다운로드
└── checkpoint.md         # 컴팩션 복구용
```

## MS Office 스킬에 대하여

`pptx` `docx` `xlsx` `pdf` 스킬은 **Anthropic 공식 자산(Proprietary 라이선스)**이다. 라이선스상 이 레포에 포함해 재배포할 수 없으므로, 각자 `scripts/install-office-skills.*`로 [공식 레포](https://github.com/anthropics/skills)에서 직접 받아 설치한다. 자세한 내용은 `SETUP.md` 참고.
