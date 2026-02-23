import { loadPandaData } from '../context'
import { buildFileState, isPandaAttribute, isPandaProp, isRecipeVariant } from '../helpers'
import { isIdentifier, isJSXExpressionContainer, isLiteral, isTemplateLiteral } from '../nodes'
import { getArbitraryValue } from '@pandacss/shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

export const noEscapeHatch = {
  meta: {
    type: 'problem' as const,
    messages: {
      escapeHatch:
        'Avoid using the escape hatch [value] for undefined tokens. Define a corresponding token in your design system for better consistency and maintainability.',
      remove: 'Remove the square brackets (`[]`).',
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

    const removeBrackets = (range: readonly [number, number]) => {
      const [start, end] = range
      return [start + 1, end - 1] as const
    }

    const hasEscapeHatch = (value: string | undefined): boolean => {
      if (!value) return false
      if (!value.includes('[')) return false
      return getArbitraryValue(value) !== value.trim()
    }

    const handleNodeValue = (node: Context, value: string) => {
      if (!hasEscapeHatch(value)) return
      context.report({
        node,
        messageId: 'escapeHatch',
        suggest: [
          {
            messageId: 'remove',
            fix: (fixer: Context) => fixer.replaceTextRange(removeBrackets(node.range), getArbitraryValue(value)),
          },
        ],
      })
    }

    return {
      JSXAttribute(node: Context) {
        if (!node.value) return
        if (!isPandaProp(node, data, fileState)) return

        const { value } = node

        if (isLiteral(value)) {
          handleNodeValue(value, value.value?.toString() ?? '')
        } else if (isJSXExpressionContainer(value)) {
          const expr = value.expression
          if (isLiteral(expr)) {
            handleNodeValue(expr, expr.value?.toString() ?? '')
          } else if (isTemplateLiteral(expr) && expr.expressions.length === 0) {
            handleNodeValue(expr.quasis[0], expr.quasis[0].value.raw)
          }
        }
      },

      Property(node: Context) {
        if (!isIdentifier(node.key)) return
        if (!isPandaAttribute(node, data, fileState)) return
        if (isRecipeVariant(node, data, fileState)) return

        const value = node.value
        if (isLiteral(value)) {
          handleNodeValue(value, value.value?.toString() ?? '')
        } else if (isTemplateLiteral(value) && value.expressions.length === 0) {
          handleNodeValue(value.quasis[0], value.quasis[0].value.raw)
        }
      },
    }
  },
}
