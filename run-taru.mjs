#!/usr/bin/env node
/**
 * Taru launcher — PTY wrapper with auto-Enter + restart loop.
 *
 * Handles the interactive confirmation prompt that
 * `--dangerously-load-development-channels` shows on startup by:
 *   1. Watching output for prompt-ish markers and replying when detected.
 *   2. Falling back to timed `\r` retries (2s, 5s, 10s, 20s) for cold starts
 *      where the prompt appears late.
 * Then forwards I/O transparently. On exit (any code), waits 3s and respawns.
 */
import pty from 'node-pty'
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.chdir(__dirname)

const LOG_FILE = path.join(__dirname, '.cache', 'launcher.log')
try { fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true }) } catch {}
function launcherLog(msg) {
  const line = `[${new Date().toISOString()}] [mjs] ${msg}\n`
  try { fs.appendFileSync(LOG_FILE, line) } catch {}
  try { process.stdout.write(line) } catch {}
}

process.on('uncaughtException', (err) => {
  launcherLog(`uncaughtException: ${err && err.stack || err}`)
})
process.on('unhandledRejection', (reason) => {
  launcherLog(`unhandledRejection: ${reason && (reason.stack || reason.message) || reason}`)
})
process.on('exit', (code) => {
  // Synchronous only — fs.appendFileSync ok inside 'exit'.
  try {
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] [mjs] process.exit code=${code}\n`)
  } catch {}
})

launcherLog(`launcher starting (pid=${process.pid}, platform=${process.platform})`)

const CLAUDE_ARGS = [
  '--model', 'opus',
  '--effort', 'xhigh',
  '--dangerously-skip-permissions',
  '--strict-mcp-config', '--mcp-config', '.mcp-taru.json',
  '--dangerously-load-development-channels', 'server:taru',
]

const isWindows = process.platform === 'win32'
const SPAWN_CMD = isWindows ? 'cmd.exe' : 'claude'
const SPAWN_ARGS = isWindows ? ['/c', 'claude', ...CLAUDE_ARGS] : CLAUDE_ARGS

// Prompt markers that indicate claude is waiting for acknowledgement.
// Match loosely — raw PTY output includes ANSI escapes around these words.
const PROMPT_PATTERNS = [
  /press\s+enter/i,
  /\[y\/n\]/i,
  /\(y\/n\)/i,
  /continue\?/i,
  /proceed\?/i,
  /do you want to/i,
  /development channels/i,
  /dangerously/i,
  /trust/i,
]

// Marker that claude UI has fully rendered — stop sending retry Enters.
// Matches the shortcut footer claude prints when interactive ready.
const READY_PATTERNS = [
  /\? for shortcuts/i,
  /\bshortcuts\b/i,
]

function spawnClaude() {
  const cols = process.stdout.columns || 120
  const rows = process.stdout.rows || 30
  launcherLog(`spawning ${SPAWN_CMD} ${SPAWN_ARGS.join(' ')} (cols=${cols} rows=${rows})`)
  const p = pty.spawn(SPAWN_CMD, SPAWN_ARGS, {
    name: 'xterm-256color',
    cols, rows,
    cwd: process.cwd(),
    env: process.env,
  })
  launcherLog(`spawned pty pid=${p.pid}`)
  return p
}

async function runOnce() {
  const proc = spawnClaude()

  let answered = false
  let ready = false
  let outputBuf = ''

  const sendEnter = (reason) => {
    if (answered || ready) return
    try {
      proc.write('\r')
      process.stdout.write(`\n[taru] auto-Enter (${reason})\n`)
    } catch {}
  }

  const retryTimers = [2000, 5000, 10000, 20000].map(ms =>
    setTimeout(() => sendEnter(`t=${ms}ms`), ms)
  )

  proc.onData(d => {
    process.stdout.write(d)
    if (ready) return
    outputBuf = (outputBuf + d).slice(-4000) // keep last 4KB for pattern scan

    if (!answered && PROMPT_PATTERNS.some(p => p.test(outputBuf))) {
      answered = true
      setTimeout(() => {
        try { proc.write('\r') } catch {}
        process.stdout.write(`\n[taru] auto-Enter (prompt detected)\n`)
      }, 150)
    }

    if (READY_PATTERNS.some(p => p.test(outputBuf))) {
      ready = true
      retryTimers.forEach(clearTimeout)
    }
  })

  const onStdin = d => {
    try { proc.write(d) } catch {}
  }
  process.stdin.on('data', onStdin)
  if (process.stdin.isTTY) process.stdin.setRawMode(true)
  process.stdin.resume()

  const onResize = () => {
    try { proc.resize(process.stdout.columns || 120, process.stdout.rows || 30) } catch {}
  }
  process.stdout.on('resize', onResize)

  const exitInfo = await new Promise(res => {
    proc.onExit(({ exitCode, signal }) => res({ exitCode: exitCode ?? 0, signal }))
  })
  launcherLog(`pty exited pid=${proc.pid} code=${exitInfo.exitCode} signal=${exitInfo.signal ?? 'none'}`)

  retryTimers.forEach(clearTimeout)
  process.stdin.off('data', onStdin)
  process.stdout.off('resize', onResize)
  if (process.stdin.isTTY) process.stdin.setRawMode(false)
  process.stdin.pause()

  return exitInfo.exitCode
}

let shuttingDown = false
const shutdown = (sig) => {
  if (shuttingDown) process.exit(130)
  shuttingDown = true
  launcherLog(`shutdown signal received: ${sig}`)
  if (process.stdin.isTTY) process.stdin.setRawMode(false)
  process.stdin.pause()
  process.exit(130)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

while (true) {
  let code
  try {
    code = await runOnce()
  } catch (err) {
    launcherLog(`runOnce threw: ${err && err.stack || err}`)
    code = -1
  }
  if (shuttingDown) break
  const ts = new Date().toISOString()
  process.stdout.write(`\n[${ts}] Taru exited (code: ${code}), restarting in 3s...\n`)
  launcherLog(`inner exited code=${code}, restarting in 3s`)
  await new Promise(r => setTimeout(r, 3000))
}
