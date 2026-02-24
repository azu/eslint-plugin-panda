#!/usr/bin/env node
import { findConfig, loadConfig } from '@pandacss/config'
import { Generator } from '@pandacss/generator'
import fs from 'node:fs'
import path from 'node:path'

async function main() {
  const args = process.argv.slice(2)
  const configArg = args[0]
  const outputArg = args[1] ?? 'panda-data.json'

  const cwd = process.cwd()
  const configPath = configArg ? path.resolve(cwd, configArg) : findConfig({ cwd })

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
  // @ts-expect-error tokens.view.values type mismatch across panda versions
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

  const data = {
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

  const outputPath = path.resolve(cwd, outputArg)
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))
  console.log(`Generated panda-data.json at ${outputPath}`)
  console.log(`  Valid properties: ${data.allValidProps.length}`)
  console.log(`  Token paths: ${allTokenPaths.length}`)
  console.log(`  Deprecated tokens: ${deprecatedTokenPaths.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
