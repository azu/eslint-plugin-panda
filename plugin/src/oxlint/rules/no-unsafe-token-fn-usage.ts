import { loadPandaData } from '../context'
import {
  buildFileState,
  extractTokens,
  getTokenImport,
  isPandaAttribute,
  isPandaProp,
  isRecipeVariant,
} from '../helpers'
import { isCallExpression, isIdentifier, isJSXExpressionContainer, isLiteral, isTemplateLiteral } from '../nodes'
import { getArbitraryValue } from '@pandacss/shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

export const noUnsafeTokenFnUsage = {
  meta: {
    type: 'suggestion' as const,
    messages: {
      noUnsafeTokenFnUsage: 'Unnecessary token function usage. Prefer design token.',
      replace: 'Replace token function with `{{safe}}`.',
    },
    hasSuggestions: true,
    schema: [],
  },
  create(context: Context) {
    const configPath = context.settings?.['@pandacss/configPath']
    if (!configPath) return {}
    const data = loadPandaData(configPath)
    const fileState = buildFileState(context.sourceCode.ast, data)
    if (fileState.pandaImports.length === 0) return {}

    let tokenImportCache: { alias: string } | null | undefined

    const getCachedTokenImport = (): { alias: string } | null | undefined => {
      if (tokenImportCache !== undefined) return tokenImportCache
      tokenImportCache = getTokenImport(fileState) ?? null
      return tokenImportCache
    }

    const isUnsafeCallExpression = (node: Context): boolean => {
      const tkImport = getCachedTokenImport()
      return isIdentifier(node.callee) && node.callee.name === tkImport?.alias
    }

    const tokenWrap = (value?: string): string => (value ? `token(${value})` : '')

    const isCompositeValue = (input?: string): boolean => {
      if (!input) return false
      const tokenRegex = /^(?:token\([^)]*\)|\{[^}]*\})$/
      return !tokenRegex.test(input)
    }

    const sendReport = (node: Context, value: string) => {
      const tkImports = extractTokens(value)
      if (!tkImports.length) return
      const token = tkImports[0].replace(/^[^.]*\./, '')

      context.report({
        node,
        messageId: 'noUnsafeTokenFnUsage',
        suggest: [
          {
            messageId: 'replace',
            data: { safe: token },
            fix: (fixer: Context) => fixer.replaceText(node, `'${token}'`),
          },
        ],
      })
    }

    const handleRuntimeFn = (node: Context) => {
      if (!isCallExpression(node)) return
      if (!isUnsafeCallExpression(node)) return

      const value = node.arguments[0]

      if (isLiteral(value)) {
        const val = getArbitraryValue(value.value?.toString() ?? '')
        sendReport(node, tokenWrap(val))
      } else if (isTemplateLiteral(value) && value.expressions.length === 0) {
        const val = getArbitraryValue(value.quasis[0].value.raw)
        sendReport(node, tokenWrap(val))
      }
    }

    const handleLiteral = (node: Context) => {
      if (!isLiteral(node)) return
      const value = getArbitraryValue(node.value?.toString() ?? '')
      if (isCompositeValue(value)) return

      sendReport(node, value)
    }

    const handleTemplateLiteral = (node: Context) => {
      if (!isTemplateLiteral(node) || node.expressions.length > 0) return
      const value = getArbitraryValue(node.quasis[0].value.raw)
      if (isCompositeValue(value)) return

      sendReport(node, value)
    }

    return {
      JSXAttribute(node: Context) {
        if (!node.value) return
        if (!isPandaProp(node, data, fileState)) return

        handleLiteral(node.value)

        if (isJSXExpressionContainer(node.value)) {
          const expression = node.value.expression
          handleLiteral(expression)
          handleTemplateLiteral(expression)
          handleRuntimeFn(expression)
        }
      },

      Property(node: Context) {
        if (!isPandaAttribute(node, data, fileState)) return
        if (isRecipeVariant(node, data, fileState)) return

        const valueNode = node.value

        if (isCallExpression(valueNode) || isLiteral(valueNode) || isTemplateLiteral(valueNode)) {
          handleRuntimeFn(valueNode)
          handleLiteral(valueNode)
          handleTemplateLiteral(valueNode)
        }
      },
    }
  },
}
