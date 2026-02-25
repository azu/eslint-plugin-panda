import { describe, it, expect, afterAll, vi } from 'vitest'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

function configHash(cfgPath: string): string {
  return crypto.createHash('md5').update(cfgPath).digest('hex').slice(0, 8)
}

function tmpJsonPath(cfgPath: string): string {
  return path.join(os.tmpdir(), `panda-data-${process.pid}-${configHash(cfgPath)}.json`)
}

// Minimal valid panda-data JSON for testing
const validPandaDataJSON = {
  jsxFactory: undefined,
  include: [],
  exclude: [],
  cwd: '/tmp',
  importMap: { css: [], recipe: [], pattern: [], jsx: [] },
  jsxNames: [],
  pathMappings: [],
  allValidProps: ['color', 'display'],
  shorthandToLonghand: {},
  longhandToShorthands: {},
  propToCategory: {},
  patternProps: {},
  allTokenPaths: [],
  deprecatedTokenPaths: [],
}

describe('loadPandaData filesystem cache', () => {
  const fakeConfigPath = '/tmp/fake-panda.config.ts'
  const jsonPath = tmpJsonPath(fakeConfigPath)

  afterAll(() => {
    try {
      fs.unlinkSync(jsonPath)
    } catch {
      // already cleaned up
    }
  })

  it('skips execSync when tmp file already exists', async () => {
    // Pre-create the tmp JSON file to simulate a previous run
    fs.writeFileSync(jsonPath, JSON.stringify(validPandaDataJSON))

    const { loadPandaData } = await import('../src/oxlint/context')

    // loadPandaData should read from the existing file without calling execSync
    const data = loadPandaData(fakeConfigPath)
    expect(data).toBeDefined()
    expect(data.allValidProps.has('color')).toBe(true)
    expect(data.allValidProps.has('display')).toBe(true)
  })
})
