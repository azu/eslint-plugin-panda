import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/utils/worker.ts'],
    format: ['esm', 'cjs'],
    shims: true,
  },
  {
    entry: {
      oxlint: 'src/oxlint.ts',
      'oxlint/generate-data': 'src/oxlint/generate-data.ts',
    },
    format: ['esm', 'cjs'],
    shims: true,
  },
])
