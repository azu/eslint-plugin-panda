import { execSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export type ImportResult = {
  name: string
  alias: string
  mod: string
  kind?: string
  importMapValue?: string
}

export type DeprecatedToken =
  | string
  | {
      category: string
      value: string
    }

type PathMapping = {
  pattern: RegExp
  paths: string[]
}

type PandaDataJSON = {
  jsxFactory: string | undefined
  include: string[]
  exclude: string[]
  cwd: string
  importMap: { css: string[]; recipe: string[]; pattern: string[]; jsx: string[] }
  jsxNames: string[]
  pathMappings: PathMapping[]
  allValidProps: string[]
  shorthandToLonghand: Record<string, string>
  longhandToShorthands: Record<string, string[]>
  propToCategory: Record<string, string | undefined>
  patternProps: Record<string, string[]>
  allTokenPaths: string[]
  deprecatedTokenPaths: string[]
}

export type PandaData = {
  jsxFactory: string | undefined
  include: string[]
  exclude: string[]
  cwd: string
  importMap: { css: string[]; recipe: string[]; pattern: string[]; jsx: string[] }
  jsxNames: string[]
  pathMappings: PathMapping[]
  allValidProps: Set<string>
  shorthandToLonghand: Map<string, string>
  longhandToShorthands: Map<string, string[]>
  propToCategory: Map<string, string | undefined>
  patternProps: Map<string, Set<string>>
  allTokenPaths: Set<string>
  deprecatedTokenPaths: Set<string>
}

const cache = new Map<string, PandaData>()
let cleanupRegistered = false

function configHash(configPath: string): string {
  return crypto.createHash('md5').update(configPath).digest('hex').slice(0, 8)
}

function generateData(configPath: string): string {
  const jsonPath = path.join(os.tmpdir(), `panda-data-${process.pid}-${configHash(configPath)}.json`)
  if (!fs.existsSync(jsonPath)) {
    const generateScript = path.resolve(__dirname, 'oxlint', 'generate-data.mjs')
    const script = fs.existsSync(generateScript)
      ? generateScript
      : path.resolve(__dirname, 'oxlint', 'generate-data.js')
    execSync(`node ${script} ${configPath} ${jsonPath}`, {
      stdio: 'pipe',
      cwd: path.dirname(configPath),
    })
  }

  if (!cleanupRegistered) {
    process.on('exit', cleanup)
    cleanupRegistered = true
  }

  return jsonPath
}

function cleanup(): void {
  const tmpDir = os.tmpdir()
  const prefix = `panda-data-${process.pid}-`
  try {
    for (const file of fs.readdirSync(tmpDir)) {
      if (file.startsWith(prefix) && file.endsWith('.json')) {
        try {
          fs.unlinkSync(path.join(tmpDir, file))
        } catch {
          // already removed
        }
      }
    }
  } catch {
    // tmpdir read failed
  }
}

export function loadPandaData(configPath: string): PandaData {
  const absConfigPath = path.isAbsolute(configPath) ? configPath : path.resolve(process.cwd(), configPath)

  const hit = cache.get(absConfigPath)
  if (hit) return hit

  const jsonPath = generateData(absConfigPath)

  const raw: PandaDataJSON = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  // Restore RegExp objects from serialized pathMappings
  const pathMappings: PathMapping[] = (raw.pathMappings ?? []).map((pm) => ({
    pattern: new RegExp(typeof pm.pattern === 'string' ? pm.pattern : (pm.pattern as { source: string }).source),
    paths: pm.paths,
  }))

  const data: PandaData = {
    jsxFactory: raw.jsxFactory,
    include: raw.include,
    exclude: raw.exclude,
    cwd: raw.cwd,
    importMap: raw.importMap,
    jsxNames: raw.jsxNames,
    pathMappings,
    allValidProps: new Set(raw.allValidProps),
    shorthandToLonghand: new Map(Object.entries(raw.shorthandToLonghand)),
    longhandToShorthands: new Map(Object.entries(raw.longhandToShorthands)),
    propToCategory: new Map(Object.entries(raw.propToCategory)),
    patternProps: new Map(Object.entries(raw.patternProps).map(([k, v]) => [k, new Set(v)])),
    allTokenPaths: new Set(raw.allTokenPaths),
    deprecatedTokenPaths: new Set(raw.deprecatedTokenPaths),
  }

  cache.set(absConfigPath, data)
  return data
}

export function isValidProperty(data: PandaData, name: string, patternName?: string): boolean {
  if (data.allValidProps.has(name)) return true
  if (!patternName) return false
  if (patternName === data.jsxFactory) return false
  return data.patternProps.get(patternName)?.has(name) ?? false
}

export function resolveLonghand(data: PandaData, name: string): string | undefined {
  return data.shorthandToLonghand.get(name)
}

export function getPropCategory(data: PandaData, prop: string): string | undefined {
  const longhand = data.shorthandToLonghand.get(prop) ?? prop
  return data.propToCategory.get(longhand)
}
