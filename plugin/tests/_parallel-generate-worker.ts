// Worker script: tests parallel-safe file generation using proper-lockfile.
// Simulates the lock → check → generate → rename → unlock pattern from context.ts.

import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import { lockSync } from 'proper-lockfile'

const configPath = process.argv[2]
const jsonPath = process.argv[3]
if (!configPath || !jsonPath) {
  console.error('Usage: worker.ts <configPath> <jsonPath>')
  process.exit(1)
}

function waitForFile(filePath: string, timeoutMs: number): void {
  const start = Date.now()
  while (!fs.existsSync(filePath)) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for ${filePath}`)
    }
    spawnSync('sleep', ['0.1'])
  }
}

if (fs.existsSync(jsonPath)) {
  console.log(`[${process.pid}] already exists`)
  process.exit(0)
}

let release: (() => void) | undefined
try {
  release = lockSync(configPath, { stale: 30000 })
} catch {
  console.log(`[${process.pid}] lock failed, waiting...`)
  waitForFile(jsonPath, 60000)
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  console.log(`[${process.pid}] OK (waited): ${data.allValidProps.length} props`)
  process.exit(0)
}

try {
  if (fs.existsSync(jsonPath)) {
    console.log(`[${process.pid}] already exists after lock`)
    process.exit(0)
  }

  console.log(`[${process.pid}] generating...`)
  // Simulate expensive generation with a delay
  const tmpPath = jsonPath + '.tmp'
  const fakeData = { allValidProps: ['color', 'bg', 'p', 'mx'], generated: true, pid: process.pid }
  spawnSync('sleep', ['0.5']) // simulate generation cost
  fs.writeFileSync(tmpPath, JSON.stringify(fakeData, null, 2))
  fs.renameSync(tmpPath, jsonPath)
  console.log(`[${process.pid}] generated`)
} finally {
  if (release) {
    try {
      release()
    } catch {}
  }
}
