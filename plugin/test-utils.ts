//@ts-expect-error
import { RuleTester } from 'eslint-docgen'
import { RuleTester as ERuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'

const baseTesterConfig = {
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest' as const,
    sourceType: 'module' as const,
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
}

// eslint-docgen still uses legacy format
const legacyTesterConfig = {
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
}

export const tester = new RuleTester(legacyTesterConfig)
export const eslintTester = new ERuleTester(baseTesterConfig as any)
