<!-- This file is built by build-readme.js. Do not edit it directly; edit README.md.template instead. -->

# @azu/eslint-plugin-panda-oxc

Fork of [chakra-ui/eslint-plugin-panda](https://github.com/chakra-ui/eslint-plugin-panda). Adds oxlint-compatible rule
implementations alongside the original ESLint plugin.

## Fork Changes

- Package name: `@pandacss/eslint-plugin` → `@azu/eslint-plugin-panda-oxc`
- Added oxlint-compatible rules under `plugin/src/oxlint/`
- oxlint rules load data via pre-generated `panda-data.json`, removing the synckit worker dependency
- Exported via `./oxlint` subpath
- Tests reuse the same ESLint test cases for oxlint rules via vitest `resolve.alias` import swapping

## Getting Started

### Installation

```bash
pnpm add -D @pandacss/eslint-plugin
```

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

You can also enable the `recommended` rules in extends:

```diff
{
-   "plugins": ["@pandacss"]
+   "extends": ["plugin:@pandacss/recommended"]
}
```

Or enable all rules in extends:

```diff
{
-   "plugins": ["@pandacss"]
+   "extends": ["plugin:@pandacss/all"]
}
```

> [!WARNING]  
> This is not recommended. You should only enable the rules you need.

### Flat Config

If you use [the flat config format](https://eslint.org/docs/latest/use/configure/configuration-files), you can import
the plugin and rules from `@pandacss/eslint-plugin` and put it into your config.

```js filename="eslint.config.mjs"
import typescriptParser from '@typescript-eslint/parser'
import panda from '@pandacss/eslint-plugin'

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
    rules: {
      // Configure rules here
      '@pandacss/no-debug': 'error',
      // You can also use the recommended rules
      ...panda.configs.recommended.rules,
      // Or all rules
      ...panda.configs.all.rules,
    },
  },
]
```

You can see an example using `typescript-eslint` at [sandbox/v9/eslint.config.mjs](./sandbox/v9/eslint.config.mjs).

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

## Settings

### `configPath`

You can tell `eslint` to use a custom panda config file by setting the `configPath` option in your `.eslintrc.js` file.

By default we find the nearest panda config to the linted file.

```js filename=".eslintrc.(c)js"
const path = require('path')

module.exports = {
  plugins: ['@pandacss'],
  settings: {
    '@pandacss/configPath': path.join('PATH-TO/panda.config.js'),
  },
}
```

#### Flat Config

```js filename="eslint.config.mjs"
import panda from '@pandacss/eslint-plugin'
import path from 'node:path'

export default [
  {
    plugins: {
      '@pandacss': panda,
    },
    settings: {
      '@pandacss/configPath': path.join('PATH-TO/panda.config.js'),
    },
  },
]
```
