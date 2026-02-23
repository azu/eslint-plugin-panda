import { resolveTsPathPattern } from '@pandacss/config/ts-path'
import type { PandaData, ImportResult } from './context'

type Matcher = {
  mods: string[]
  nameRegex: RegExp
}

let matchersCache: Matcher[] | undefined

function buildMatchers(data: PandaData): Matcher[] {
  if (matchersCache) return matchersCache
  matchersCache = [
    { mods: data.importMap.css, nameRegex: /^(css|cva|sva)$/ },
    { mods: data.importMap.recipe, nameRegex: /.*/ },
    { mods: data.importMap.pattern, nameRegex: /.*/ },
    {
      mods: data.importMap.jsx,
      nameRegex: data.jsxNames.length > 0 ? new RegExp(`^(${data.jsxNames.map(escapeRegex).join('|')})$`) : /^$/,
    },
  ]
  return matchersCache
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function matchImport(result: ImportResult, data: PandaData): boolean {
  const matchers = buildMatchers(data)

  for (const { mods, nameRegex } of matchers) {
    if (result.kind !== 'namespace' && !nameRegex.test(result.name)) continue
    if (mods.some((m) => result.mod.includes(m))) return true
    if (data.pathMappings.length > 0) {
      const resolved = resolveTsPathPattern(data.pathMappings, result.mod)
      if (resolved) {
        for (const mod of mods) {
          if (resolved.includes([data.cwd, mod].join('/')) || resolved === mod) return true
        }
      }
    }
  }
  return false
}
