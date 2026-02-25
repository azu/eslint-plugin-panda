<!-- This file is built by build-readme.js. Do not edit it directly; edit README.md.template instead. -->

# @azu/eslint-plugin-panda-oxc

Fork of [chakra-ui/eslint-plugin-panda](https://github.com/chakra-ui/eslint-plugin-panda). Provides oxlint-compatible
Panda CSS rule implementations as a drop-in replacement for `@pandacss/eslint-plugin`.

## Getting Started

### Installation

```bash
pnpm add -D @azu/eslint-plugin-panda-oxc
```

npm:

```bash
npm install -D @azu/eslint-plugin-panda-oxc
```

### oxlint

Load the plugin via `jsPlugins` and set `@pandacss/configPath` in `settings` to the path of a panda-data JSON file.

`createPandaJSON` is an async function that generates a panda-data JSON file from your Panda CSS config and returns the
file path. Generate the JSON before running the linter to avoid spawning subprocesses during linting.

```js
import { createPandaJSON } from '@azu/eslint-plugin-panda-oxc'

const pandaDataPath = await createPandaJSON(import.meta.dirname, 'panda.config.ts')

export default {
  plugins: ['typescript', 'react'],
  jsPlugins: [{ name: '@pandacss', specifier: '@azu/eslint-plugin-panda-oxc' }],
  settings: {
    '@pandacss/configPath': pandaDataPath,
  },
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
