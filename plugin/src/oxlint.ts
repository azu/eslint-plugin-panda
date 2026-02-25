export { createPandaJSON } from './oxlint/create-panda-json'

import noDebug from './oxlint/rules/no-debug'
import noImportant from './oxlint/rules/no-important'
import noDynamicStyling from './oxlint/rules/no-dynamic-styling'
import noPropertyRenaming from './oxlint/rules/no-property-renaming'
import noPhysicalProperties from './oxlint/rules/no-physical-properties'
import preferUnifiedPropertyStyle from './oxlint/rules/prefer-unified-property-style'
import noInvalidNesting from './oxlint/rules/no-invalid-nesting'
import noUnsafeTokenFnUsage from './oxlint/rules/no-unsafe-token-fn-usage'
import noInvalidTokenPaths from './oxlint/rules/no-invalid-token-paths'
import noDeprecatedTokens from './oxlint/rules/no-deprecated-tokens'
import noConfigFunctionInSource from './oxlint/rules/no-config-function-in-source'
import fileNotIncluded from './oxlint/rules/file-not-included'
import noHardcodedColor from './oxlint/rules/no-hardcoded-color'
import noEscapeHatch from './oxlint/rules/no-escape-hatch'
import noMarginProperties from './oxlint/rules/no-margin-properties'
import preferLonghandProperties from './oxlint/rules/prefer-longhand-properties'
import preferShorthandProperties from './oxlint/rules/prefer-shorthand-properties'
import preferAtomicProperties from './oxlint/rules/prefer-atomic-properties'
import preferCompositeProperties from './oxlint/rules/prefer-composite-properties'

const plugin = {
  meta: {
    name: '@pandacss/eslint-plugin',
    version: '0.4.0',
  },
  rules: {
    'file-not-included': fileNotIncluded,
    'no-config-function-in-source': noConfigFunctionInSource,
    'no-debug': noDebug,
    'no-deprecated-tokens': noDeprecatedTokens,
    'no-dynamic-styling': noDynamicStyling,
    'no-escape-hatch': noEscapeHatch,
    'no-hardcoded-color': noHardcodedColor,
    'no-important': noImportant,
    'no-invalid-nesting': noInvalidNesting,
    'no-invalid-token-paths': noInvalidTokenPaths,
    'no-margin-properties': noMarginProperties,
    'no-physical-properties': noPhysicalProperties,
    'no-property-renaming': noPropertyRenaming,
    'no-unsafe-token-fn-usage': noUnsafeTokenFnUsage,
    'prefer-atomic-properties': preferAtomicProperties,
    'prefer-composite-properties': preferCompositeProperties,
    'prefer-longhand-properties': preferLonghandProperties,
    'prefer-shorthand-properties': preferShorthandProperties,
    'prefer-unified-property-style': preferUnifiedPropertyStyle,
  },
}

export default plugin
