#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { buildPandaData } from './create-panda-json'
import { findConfig } from '@pandacss/config'

async function main() {
  const args = process.argv.slice(2)
  const configArg = args[0]
  const outputArg = args[1] ?? 'panda-data.json'

  const cwd = process.cwd()
  const configPath = configArg ? path.resolve(cwd, configArg) : findConfig({ cwd })

  const data = await buildPandaData(configPath)

  const outputPath = path.resolve(cwd, outputArg)
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))

  if (process.env.DEBUG?.includes('eslint-plugin-panda-oxc')) {
    console.log(`Generated panda-data.json at ${outputPath}`)
    console.log(`  Valid properties: ${data.allValidProps.length}`)
    console.log(`  Token paths: ${data.allTokenPaths.length}`)
    console.log(`  Deprecated tokens: ${data.deprecatedTokenPaths.length}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
