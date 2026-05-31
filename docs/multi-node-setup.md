# 멀티노드 타루 (노트북 + 미니컴)

노트북(메인·고성능)과 미니컴(GMK NucBox, 항상 켜둠)에 타루를 둘 다 깔고,
**노트북이 켜져 있으면 노트북이, 꺼져 있으면 미니컴이** 자동으로 답하게 한다.
알람은 노트북 상태와 무관하게 **항상 미니컴**에서 발사한다.

## 동작 규칙

| 상황 | 누가 답하나 | 알람 발사 |
|---|---|---|
| 노트북 bat 켜짐 | **노트북**(primary) | 미니컴 |
| 노트북 bat 꺼짐 | **미니컴**(backup) | 미니컴 |
| 노트북 다시 켜짐 | 노트북으로 자동 복귀 | 미니컴 |

- **failover 방식(하트비트):** 노트북(primary)이 살아있는 동안 공유폴더에 "살아있음" 신호를 10초마다 기록. 미니컴(backup)은 메시지가 와도 그 신호가 신선하면 입을 닫고(노트북이 답함), 신호가 60초 이상 끊기면 자기가 답한다. 노트북이 돌아오면 자동으로 다시 양보.
- **인계 지연:** 노트북이 꺼진 뒤 미니컴이 이어받기까지 최대 ~1분(하트비트 TTL + 드라이브 동기화). 그 사이 온 메시지는 놓칠 수 있음 → 다시 물어보면 됨.
- **중복 응답 방지:** 둘 다 같은 디스코드 봇이라 동시에 켜지면 둘 다 메시지를 받지만, 위 게이트로 한쪽만 답한다.

## 무엇이 어디서 도나

- **노트북:** `run-taru.mjs` (타루 봇). `TARU_ROLE=primary`. 알람 데몬은 **안 돌림**.
- **미니컴:** `run-taru.mjs` (타루 봇, backup) + **`taru-alarmd.mjs` (알람 데몬, 미니컴에서만)**. `TARU_ROLE=backup`.
- **구글드라이브 공유폴더(`TARU_SHARED_DIR`):**
  - `memory/` — 메모리(취향·기억). 양쪽 기계의 메모리 경로를 여기로 **junction** 연결.
  - `session_notes/` — 세션노트. 마찬가지로 junction.
  - `taru-heartbeat-primary.json` — 노트북 생존 신호
  - `alarms/*.json` — 알람 예약 큐 (등록=누구나, 발사=미니컴 데몬)
  - **기억은 공유** → 노트북에서 기억한 걸 미니컴이 그대로 안다(어디서 답하든 맥락 일관). 한 번에 한 기계만 답하므로 동시 쓰기 충돌 없음.
  - **비공유(각 기계 로컬):** 만든 작업 결과물(문서·파일 등), 비밀(봇토큰·비번·쿠팡PIN), 무거운 것(프로그램·크롬·캐시·node_modules). 작업물은 필요할 때 "옮겨"라고 말하면 그때 이동.

### 기억 공유 = junction 연결 (타루가 셋업 시 실행)
원래 경로는 그대로 두고 실체만 구글드라이브로 보내, 코드 수정 없이 공유한다.
```cmd
:: 메모리
mklink /J "%USERPROFILE%\.claude\projects\C--Users-KoHwarang-Agent-taru\memory" "<공유폴더>\memory"
:: 세션노트
mklink /J "%USERPROFILE%\Documents\Taru_Memory\session_notes" "<공유폴더>\session_notes"
```
(기존 폴더에 내용이 있으면 먼저 공유폴더로 복사 후 junction. 양쪽 기계 모두 같은 공유폴더로 연결.)

## 관련 파일 (이번에 추가)

- `channels/failover.mjs` — 하트비트/게이트 로직
- `channels/discord-channel.mjs` — 메시지 핸들러에 게이트 1줄 + 하트비트 시작(환경변수 없으면 동작 변화 0, 하위호환)
- `taru-alarmd.mjs` — 미니컴 전용 알람 데몬 (공유 큐 폴링 → 디스코드 REST 발사)
- `alarm-set.mjs` — 알람을 공유 큐에 등록: `node alarm-set.mjs <channelId> <+초|ISO> "<메시지>" [userId]`
- `setup-minicom.ps1` — 미니컴 원클릭 설치 스크립트

## 켜는 순서

### A. 노트북(현재 PC) 활성화 — 미니컴 준비된 뒤에
1. 구글드라이브 데스크톱 설치 + 공유폴더 하나 생성 (예: `내 드라이브\TaruShared`).
2. `.env`에 추가:
   ```
   TARU_ROLE=primary
   TARU_SHARED_DIR=<노트북에서 본 그 폴더 경로>
   ```
3. 타루 재시작. (이 두 줄 없으면 지금처럼 단독 동작 — 기존과 동일)

### B. 미니컴 셋업 — 거의 자동
1. 미니컴에 모니터·키보드 잠깐 연결, 인터넷 연결.
2. 시작 → PowerShell **관리자 권한**으로 실행 → 한 줄 붙여넣기:
   ```powershell
   Set-ExecutionPolicy -Scope Process Bypass -Force; irm https://raw.githubusercontent.com/ghkfkddl96/taru/main/setup-minicom.ps1 | iex
   ```
3. 스크립트가 물어보는 것만 입력: **구글드라이브 공유폴더 경로**, **디스코드 봇 토큰·채널ID**.
4. 스크립트 끝의 "남은 수동 단계"(구글드라이브 로그인·KTX 자격증명·쿠팡 재로그인·Claude 로그인·윈도우 자동로그인) 따라하기.
5. 재부팅 → 모니터·키보드 분리. (쿠팡 자동구매 쓸 거면 HDMI 더미 플러그 권장)

### C. 검증
- 노트북 bat 끄고 디코로 말 걸기 → **미니컴이 답하면 성공**.
- 노트북 bat 켜고 말 걸기 → 노트북이 답.
- "5분 뒤 알람" → 노트북 꺼도 미니컴이 발사하는지 확인.
