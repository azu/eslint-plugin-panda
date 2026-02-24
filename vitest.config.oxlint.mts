import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    hideSkippedTests: true,
    isolate: false,
    testTimeout: 30000,
    include: ['plugin/tests/**/*.test.ts'],
    exclude: ['plugin/tests/_parsing.test.ts', 'plugin/tests/parallel-generate.test.ts'],
  },
  resolve: {
    alias: {
      '../test-utils': path.resolve(__dirname, 'plugin/test-utils-oxlint.ts'),
      '../src/rules/': path.resolve(__dirname, 'plugin/src/oxlint/rules/'),
    },
  },
})
