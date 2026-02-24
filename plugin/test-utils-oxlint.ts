import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import path from 'path'

const configPath = path.resolve(__dirname, '../sandbox/v9/panda.config.ts')

const testerConfig = {
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest' as const,
    sourceType: 'module' as const,
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
  settings: {
    '@pandacss/configPath': configPath,
  },
}

// oxlint tests use the same `tester` name so test files work without changes
export const tester = new RuleTester(testerConfig as any)
export const eslintTester = new RuleTester(testerConfig as any)
