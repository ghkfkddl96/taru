#!/usr/bin/env node
/**
 * 알람을 공유 큐(구글드라이브)에 등록한다. 실제 발사는 미니컴의 taru-alarmd.mjs가 한다.
 * → 누가(노트북/미니컴) 등록하든, 노트북이 꺼져도 알람은 미니컴에서 발사됨.
 *
 * 사용: node alarm-set.mjs <channelId> <when> "<message>" [userId]
 *   <when> = "+<초>" (상대시간, 예: +300) 또는 ISO 시각(예: 2026-06-01T09:00:00+09:00)
 *   userId 주면 멘션(@)으로 보내 푸시 확실.
 */
import fs from 'fs'
import path from 'path'
import os from 'os'

const SHARED = (process.env.TARU_SHARED_DIR || '').replace(/^~/, os.homedir())
if (!SHARED) { console.error('TARU_SHARED_DIR not set'); process.exit(2) }

const [, , channelId, when, message, userId] = process.argv
if (!channelId || !when) {
  console.error('usage: node alarm-set.mjs <channelId> <+sec|ISO> "<msg>" [userId]')
  process.exit(2)
}

let fireAt
if (when.startsWith('+')) fireAt = new Date(Date.now() + parseInt(when.slice(1), 10) * 1000).toISOString()
else fireAt = new Date(when).toISOString()
if (isNaN(Date.parse(fireAt))) { console.error('bad time:', when); process.exit(2) }

const id = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`
const content = (userId ? `<@${userId}> ` : '') + (message || '⏰ 알람')
const dir = path.join(SHARED, 'alarms')
fs.mkdirSync(dir, { recursive: true })
const fp = path.join(dir, `${id}.json`)
fs.writeFileSync(fp, JSON.stringify({ id, fireAt, channelId, userId: userId || null, message: content }, null, 2))
console.log(`alarm queued → ${fp}\nfireAt=${fireAt}`)
