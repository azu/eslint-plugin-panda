<!-- This file is built by build-readme.js. Do not edit it directly; edit README.md.template instead. -->

# @azu/eslint-plugin-panda-oxc

Fork of [chakra-ui/eslint-plugin-panda](https://github.com/chakra-ui/eslint-plugin-panda). Provides oxlint-compatible
Panda CSS rule implementations as a drop-in replacement for `@pandacss/eslint-plugin`.

## Getting Started

### Installation

Install as an alias of `@pandacss/eslint-plugin`:

```bash
pnpm add -D @pandacss/eslint-plugin@npm:@azu/eslint-plugin-panda-oxc
```

npm:

```bash
npm install -D @pandacss/eslint-plugin@npm:@azu/eslint-plugin-panda-oxc
```

Existing ESLint configs using `@pandacss/eslint-plugin` work without changes.

### Usage

Add `@pandacss/eslint-plugin` to the plugins section of your `.eslintrc` configuration file. You can omit the
`/eslint-plugin` suffx:

```json
{
  "plugins": ["@pandacss"]
}
```

Then configure the rules you want to use under the rules section.

```json
{
  "rules": {
    "@pandacss/no-debug": "error"
  }
}
```

### Flat Config

```js filename="eslint.config.mjs"
import typescriptParser from '@typescript-eslint/parser'
import panda, { createPandaJSON } from '@pandacss/eslint-plugin'

export default [
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    ignores: ['**/*.d.ts', 'styled-system'],
    plugins: {
      '@pandacss': panda,
    },
    languageOptions: {
      parser: typescriptParser,
    },
    settings: {
      '@pandacss/configPath': await createPandaJSON(import.meta.dirname, 'panda.config.ts'),
    },
    rules: {
      '@pandacss/no-debug': 'error',
    },
  },
]
```

### panda-data.json

`createPandaJSON` generates a panda-data JSON file from your Panda CSS config at ESLint config evaluation time and
returns the file path. Pass the returned path to `@pandacss/configPath` in settings. This avoids spawning subprocesses
during linting.

You can also pre-generate the JSON file via CLI:

```bash
node node_modules/@pandacss/eslint-plugin/dist/oxlint/generate-data.mjs panda.config.ts panda-data.json
```

Then pass the path directly:

```js
settings: {
  '@pandacss/configPath': './panda-data.json',
}
```

## Rules

Rules with ⚙️ have options. Click on the rule to see the options.

Where rules are included in the configs `recommended`, or `all` it is indicated below.

| Rule                                                                                     | `recommended` |
| ---------------------------------------------------------------------------------------- | ------------- |
| [`@pandacss/file-not-included`](docs/rules/file-not-included.md)                         | ✔️            |
| [`@pandacss/no-config-function-in-source`](docs/rules/no-config-function-in-source.md)   | ✔️            |
| [`@pandacss/no-debug`](docs/rules/no-debug.md)                                           | ✔️            |
| [`@pandacss/no-deprecated-tokens`](docs/rules/no-deprecated-tokens.md)                   | ✔️            |
| [`@pandacss/no-dynamic-styling`](docs/rules/no-dynamic-styling.md)                       | ✔️            |
| [`@pandacss/no-escape-hatch`](docs/rules/no-escape-hatch.md)                             |               |
| [`@pandacss/no-hardcoded-color`](docs/rules/no-hardcoded-color.md) ⚙️                    | ✔️            |
| [`@pandacss/no-important`](docs/rules/no-important.md)                                   |               |
| [`@pandacss/no-invalid-token-paths`](docs/rules/no-invalid-token-paths.md)               | ✔️            |
| [`@pandacss/no-invalid-nesting`](docs/rules/no-invalid-nesting.md)                       | ✔️            |
| [`@pandacss/no-margin-properties`](docs/rules/no-margin-properties.md) ⚙️                |               |
| [`@pandacss/no-physical-properties`](docs/rules/no-physical-properties.md) ⚙️            |               |
| [`@pandacss/no-property-renaming`](docs/rules/no-property-renaming.md)                   | ✔️            |
| [`@pandacss/no-unsafe-token-fn-usage`](docs/rules/no-unsafe-token-fn-usage.md)           | ✔️            |
| [`@pandacss/prefer-longhand-properties`](docs/rules/prefer-longhand-properties.md) ⚙️    |               |
| [`@pandacss/prefer-shorthand-properties`](docs/rules/prefer-shorthand-properties.md) ⚙️  |               |
| [`@pandacss/prefer-atomic-properties`](docs/rules/prefer-atomic-properties.md) ⚙️        |               |
| [`@pandacss/prefer-composite-properties`](docs/rules/prefer-composite-properties.md) ⚙️  |               |
| [`@pandacss/prefer-unified-property-style`](docs/rules/prefer-unified-property-style.md) |               |
