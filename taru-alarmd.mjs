#!/usr/bin/env node
/**
 * Taru 알람 데몬 — **항상 켜져있는 미니컴에서만** 돌린다.
 *
 * 공유폴더(구글드라이브)의 알람 큐를 폴링하다가 시각이 되면 디스코드로 직접 발사한다.
 * 노트북이 알람을 "등록"(alarm-set.mjs)해도 발사는 이 데몬(미니컴)이 하므로,
 * 노트북이 꺼져 있어도 알람은 정상적으로 폰에 온다.
 *
 * 실행: node taru-alarmd.mjs   (repo 루트에서, .env 의 DISCORD_BOT_TOKEN 사용)
 * 필요 env: DISCORD_BOT_TOKEN, TARU_SHARED_DIR
 */
import fs from 'fs'
import path from 'path'
import os from 'os'
import 'dotenv/config'

const TOKEN = process.env.DISCORD_BOT_TOKEN
const SHARED = (process.env.TARU_SHARED_DIR || '').replace(/^~/, os.homedir())
const POLL_MS = parseInt(process.env.TARU_ALARM_POLL_MS, 10) || 15_000

function log(...a) { process.stdout.write(`[alarmd ${new Date().toISOString()}] ${a.join(' ')}\n`) }

if (!TOKEN) { log('ERROR: DISCORD_BOT_TOKEN missing'); process.exit(1) }
if (!SHARED) { log('ERROR: TARU_SHARED_DIR missing'); process.exit(1) }

const ALARM_DIR = path.join(SHARED, 'alarms')
const DONE_DIR = path.join(ALARM_DIR, 'done')
fs.mkdirSync(DONE_DIR, { recursive: true })

async function sendDiscord(channelId, content) {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, allowed_mentions: { parse: ['users'] } }),
  })
  if (!res.ok) throw new Error(`discord ${res.status}: ${(await res.text()).slice(0, 200)}`)
}

async function tick() {
  let files
  try { files = fs.readdirSync(ALARM_DIR).filter((f) => f.endsWith('.json')) } catch { return }
  const now = Date.now()
  for (const f of files) {
    const fp = path.join(ALARM_DIR, f)
    let job
    try { job = JSON.parse(fs.readFileSync(fp, 'utf8')) } catch { continue }
    const fireAt = Date.parse(job.fireAt)
    if (!fireAt || now < fireAt) continue
    try {
      await sendDiscord(job.channelId, job.message || '⏰ 알람')
      log(`fired ${f} → ch ${job.channelId}`)
      fs.renameSync(fp, path.join(DONE_DIR, `${Date.now()}_${f}`))
    } catch (e) {
      log(`send failed ${f}: ${e.message} (retry next tick)`)
    }
  }
}

log(`started. watching ${ALARM_DIR} every ${POLL_MS}ms`)
tick()
setInterval(tick, POLL_MS)
