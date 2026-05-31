/**
 * Failover — 노트북(primary) 우선, 미니컴(backup) 자동 인계.
 *
 * 두 기계가 같은 디스코드 봇으로 동시에 붙어도 한쪽만 응답하게 만든다.
 *   - primary: 항상 응답 + 공유폴더에 "살아있음" 하트비트를 주기적으로 기록.
 *   - backup : 메시지가 와도 primary 하트비트가 신선하면 무시(=노트북이 답함),
 *              하트비트가 끊기면(노트북 off) 그때 자기가 응답.
 *
 * 환경변수가 없으면(=지금 단일 PC) 아무 동작 변화 없음(primary, 하트비트 미작동).
 *   TARU_ROLE              primary | backup   (기본 primary)
 *   TARU_SHARED_DIR        구글드라이브 공유폴더 경로 (양 기계가 같은 폴더를 봄)
 *   TARU_HEARTBEAT_TTL_MS  primary 죽음 판정 시간 (기본 60000)  ← 드라이브 동기화 지연보다 넉넉히
 *   TARU_HEARTBEAT_INTERVAL_MS  하트비트 기록 주기 (기본 10000)
 */
import fs from 'fs'
import path from 'path'
import os from 'os'

export function makeFailover({ sharedDir, role, agentName = 'taru', log = () => {} }) {
  const TTL = parseInt(process.env.TARU_HEARTBEAT_TTL_MS, 10) || 60_000
  const INTERVAL = parseInt(process.env.TARU_HEARTBEAT_INTERVAL_MS, 10) || 10_000
  const resolvedRole = String(role || 'primary').toLowerCase()
  const hbDir = sharedDir ? String(sharedDir).replace(/^~/, os.homedir()) : null
  const hbFile = hbDir ? path.join(hbDir, `${agentName}-heartbeat-primary.json`) : null
  const hostId = `${os.hostname()}#${process.pid}`
  let timer = null

  function writeHeartbeat() {
    if (!hbFile) return
    try {
      fs.mkdirSync(path.dirname(hbFile), { recursive: true })
      fs.writeFileSync(hbFile, JSON.stringify({ ts: Date.now(), host: hostId, role: resolvedRole }))
    } catch (e) { log('heartbeat write failed:', e.message) }
  }

  function primaryAlive() {
    if (!hbFile) return false
    try {
      const { ts } = JSON.parse(fs.readFileSync(hbFile, 'utf8'))
      return typeof ts === 'number' && (Date.now() - ts) <= TTL
    } catch { return false }
  }

  return {
    role: resolvedRole,
    sharedDir: hbDir,
    start() {
      if (resolvedRole === 'primary' && hbFile) {
        writeHeartbeat()
        timer = setInterval(writeHeartbeat, INTERVAL)
        if (timer.unref) timer.unref()
        log(`failover: PRIMARY → heartbeat ${hbFile} (every ${INTERVAL}ms)`)
      } else if (resolvedRole === 'backup') {
        log(`failover: BACKUP → answers only if primary stale >${TTL}ms (watch ${hbFile || 'NO SHARED DIR'})`)
      } else {
        log('failover: PRIMARY standalone (no shared dir, no heartbeat)')
      }
    },
    /** 이 노드가 이 메시지를 처리해야 하면 true */
    shouldHandle() {
      if (resolvedRole !== 'backup') return true   // primary는 항상 처리
      if (!hbFile) return true                      // backup인데 공유폴더 없으면 일단 처리
      return !primaryAlive()                         // backup은 primary가 죽었을 때만 처리
    },
    stop() { if (timer) clearInterval(timer) },
  }
}
