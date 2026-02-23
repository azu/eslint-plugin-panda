import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

const sandboxDir = path.resolve(__dirname, '../../sandbox/v9')
const configPath = path.resolve(sandboxDir, 'panda.config.ts')
const jsonPath = path.resolve(sandboxDir, 'panda-data.json')
const workerScript = path.resolve(__dirname, '_parallel-generate-worker.ts')

function runWorker(): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    const child = spawn('node', ['--experimental-strip-types', workerScript, configPath, jsonPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.resolve(__dirname, '..'),
    })
    child.stdout.on('data', (d) => {
      stdout += d
    })
    child.stderr.on('data', (d) => {
      stderr += d
    })
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  })
}

describe('parallel panda-data.json generation', () => {
  beforeEach(() => {
    try {
      fs.unlinkSync(jsonPath)
    } catch {}
    try {
      fs.unlinkSync(jsonPath + '.tmp')
    } catch {}
    try {
      fs.rmdirSync(configPath + '.lock')
    } catch {}
  })

  afterEach(() => {
    try {
      fs.unlinkSync(jsonPath)
    } catch {}
    try {
      fs.unlinkSync(jsonPath + '.tmp')
    } catch {}
    try {
      fs.rmdirSync(configPath + '.lock')
    } catch {}
  })

  it('should generate panda-data.json safely with 4 parallel processes', async () => {
    const WORKERS = 4

    const results = await Promise.all(Array.from({ length: WORKERS }, () => runWorker()))

    // Collect stdout for debugging
    const outputs = results.map((r) => r.stdout.trim()).filter(Boolean)
    console.log('Worker outputs:', outputs)

    // All processes should exit successfully
    for (const r of results) {
      expect(r.code, `Worker failed:\nstdout: ${r.stdout}\nstderr: ${r.stderr}`).toBe(0)
    }

    // panda-data.json should exist and be valid JSON
    expect(fs.existsSync(jsonPath)).toBe(true)
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    expect(data.allValidProps).toBeDefined()
    expect(Array.isArray(data.allValidProps)).toBe(true)
    expect(data.generated).toBe(true)

    // Exactly one process should have generated the file
    const generators = outputs.filter((o) => o.includes('generating'))
    expect(generators.length).toBe(1)

    // No leftover lock directory
    expect(fs.existsSync(configPath + '.lock')).toBe(false)

    // No leftover tmp file
    expect(fs.existsSync(jsonPath + '.tmp')).toBe(false)
  }, 120000)
})
