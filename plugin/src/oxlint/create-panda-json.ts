import { loadConfig } from '@pandacss/config'
import { Generator } from '@pandacss/generator'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * Build panda data JSON object from a Panda CSS config.
 * Returns the serializable data object.
 */
export async function buildPandaData(configPath: string) {
  const configDir = path.dirname(configPath)
  const conf = await loadConfig({ file: configPath, cwd: configDir })
  const ctx = new Generator(conf)

  // Build shorthand maps
  const shorthandToLonghand: Record<string, string> = {}
  const longhandToShorthands: Record<string, string[]> = {}
  const shorthands = ctx.utility.getPropShorthandsMap()
  for (const [key, values] of shorthands) {
    longhandToShorthands[key] = values
    for (const v of values) {
      shorthandToLonghand[v] = key
    }
  }

  // Build prop category map
  const propToCategory: Record<string, string | undefined> = {}
  for (const [prop, config] of Object.entries(ctx.utility.config)) {
    propToCategory[prop] = typeof config?.values === 'string' ? config.values : undefined
  }

  // Build pattern props map
  const patternProps: Record<string, string[]> = {}
  for (const detail of ctx.patterns.details) {
    const props = Object.keys(detail.config.properties ?? {})
    patternProps[detail.baseName] = props
    for (const jsxName of detail.jsx as string[]) {
      patternProps[jsxName] = props
    }
  }

  // Build token paths
  const allTokenPaths: string[] = []
  const deprecatedTokenPaths: string[] = []
  for (const [tokenPath] of ctx.utility.tokens.view.values) {
    allTokenPaths.push(tokenPath)
    if (ctx.utility.tokens.isDeprecated(tokenPath)) {
      deprecatedTokenPaths.push(tokenPath)
    }
  }

  // Serialize pathMappings (RegExp → source string)
  const pathMappings = (ctx.parserOptions?.tsOptions?.pathMappings ?? []).map(
    (pm: { pattern: RegExp; paths: string[] }) => ({
      pattern: pm.pattern.source,
      paths: pm.paths,
    }),
  )

  return {
    jsxFactory: ctx.config.jsxFactory,
    include: ctx.config.include ?? [],
    exclude: ctx.config.exclude ?? [],
    cwd: ctx.config.cwd ?? configDir,
    importMap: (ctx.imports as { value: { css: string[]; recipe: string[]; pattern: string[]; jsx: string[] } }).value,
    jsxNames: (ctx.jsx as { names: string[] }).names ?? [],
    pathMappings,
    allValidProps: Object.keys(ctx.utility.config),
    shorthandToLonghand,
    longhandToShorthands,
    propToCategory,
    patternProps,
    allTokenPaths,
    deprecatedTokenPaths,
  }
}

/**
 * Generate a panda-data JSON file from a Panda CSS config and return the JSON file path.
 * Use in ESLint flat config:
 * ```
 * settings: {
 *   "@pandacss/configPath": await createPandaJSON(import.meta.dirname, "panda.config.ts"),
 * }
 * ```
 */
export async function createPandaJSON(basedir: string, configRelativePath: string): Promise<string> {
  const configPath = path.resolve(basedir, configRelativePath)
  const data = await buildPandaData(configPath)

  const jsonPath = path.join(os.tmpdir(), `panda-data-${process.pid}.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2))

  process.on('exit', () => {
    try {
      fs.unlinkSync(jsonPath)
    } catch {
      // already removed
    }
  })

  return jsonPath
}
