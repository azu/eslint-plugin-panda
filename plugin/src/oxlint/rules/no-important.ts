import { loadPandaData } from '../context'
import { buildFileState, isPandaAttribute, isPandaProp, isRecipeVariant } from '../helpers'
import { isIdentifier, isJSXExpressionContainer, isLiteral, isTemplateLiteral } from '../nodes'
import { getArbitraryValue } from '@pandacss/shared'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

const exclamationRegex = /\s*!$/
const importantRegex = /\s*!important\s*$/

export const RULE_NAME = 'no-important'

const rule = {
  meta: {
    type: 'problem' as const,
    messages: {
      important:
        'Avoid using the {{keyword}} keyword. Refactor your code to prioritize specificity for predictable styling.',
      remove: 'Remove the `{{keyword}}` keyword.',
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

    const removeQuotes = (range: readonly [number, number]) => {
      const [start, end] = range
      return [start + 1, end - 1] as const
    }

    const hasImportantKeyword = (value: string | undefined): boolean => {
      if (!value) return false
      const arbitraryValue = getArbitraryValue(value)
      return exclamationRegex.test(arbitraryValue) || importantRegex.test(arbitraryValue)
    }

    const removeImportantKeyword = (input: string): { fixed: string; keyword: string | null } => {
      if (importantRegex.test(input)) {
        return { fixed: input.replace(importantRegex, '').trimEnd(), keyword: '!important' }
      } else if (exclamationRegex.test(input)) {
        return { fixed: input.replace(exclamationRegex, '').trimEnd(), keyword: '!' }
      }
      return { fixed: input, keyword: null }
    }

    const handleNodeValue = (node: Context, value: string) => {
      if (!hasImportantKeyword(value)) return

      const { fixed, keyword } = removeImportantKeyword(value)

      context.report({
        node,
        messageId: 'important',
        data: { keyword },
        suggest: [
          {
            messageId: 'remove',
            data: { keyword },
            fix: (fixer: Context) => {
              return fixer.replaceTextRange(removeQuotes(node.range), fixed)
            },
          },
        ],
      })
    }

    return {
      JSXAttribute(node: Context) {
        if (!node.value) return
        if (!isPandaProp(node, data, fileState)) return

        const valueNode = node.value

        if (isLiteral(valueNode)) {
          const val = valueNode.value?.toString() ?? ''
          handleNodeValue(valueNode, val)
        } else if (isJSXExpressionContainer(valueNode)) {
          const expr = valueNode.expression

          if (isLiteral(expr)) {
            const val = expr.value?.toString() ?? ''
            handleNodeValue(expr, val)
          } else if (isTemplateLiteral(expr) && expr.expressions.length === 0) {
            const val = expr.quasis[0].value.raw
            handleNodeValue(expr.quasis[0], val)
          }
        }
      },

      Property(node: Context) {
        if (!isIdentifier(node.key)) return
        if (!isPandaAttribute(node, data, fileState)) return
        if (isRecipeVariant(node, data, fileState)) return

        const valueNode = node.value

        if (isLiteral(valueNode)) {
          const val = valueNode.value?.toString() ?? ''
          handleNodeValue(valueNode, val)
        } else if (isTemplateLiteral(valueNode) && valueNode.expressions.length === 0) {
          const val = valueNode.quasis[0].value.raw
          handleNodeValue(valueNode.quasis[0], val)
        }
      },
    }
  },
}

export default rule
