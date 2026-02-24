import { loadPandaData } from '../context'
import { buildFileState, isInJSXProp, isInPandaFunction, isRecipeVariant, isStyledProperty } from '../helpers'
import { isLiteral, isTemplateLiteral } from '../nodes'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

export const RULE_NAME = 'no-invalid-nesting'

const rule = {
  meta: {
    type: 'problem' as const,
    messages: {
      nesting: 'Invalid style nesting. Nested styles must contain the `&` character.',
    },
    schema: [],
  },
  create(context: Context) {
    const configPath = context.settings?.['@pandacss/configPath']
    if (!configPath) return {}
    const data = loadPandaData(configPath)
    const fileState = buildFileState(context.sourceCode.ast, data)
    if (fileState.pandaImports.length === 0) return {}

    const isInvalidNestingSelector = (node: Context): boolean => {
      if (isLiteral(node) && typeof node.value === 'string') {
        return !node.value.includes('&')
      } else if (isTemplateLiteral(node) && node.expressions.length === 0) {
        return !node.quasis[0].value.raw.includes('&')
      }
      return false
    }

    return {
      'Property[key.type!=/Identifier/][value.type="ObjectExpression"]'(node: Context) {
        const inPandaFunction = !!isInPandaFunction(node, data, fileState)
        const inJSXProp = isInJSXProp(node, data, fileState)

        if (!inPandaFunction && !inJSXProp) return
        if (isRecipeVariant(node, data, fileState)) return
        if (isStyledProperty(node, data)) return

        const keyNode = node.key

        if (isInvalidNestingSelector(keyNode)) {
          context.report({
            node: keyNode,
            messageId: 'nesting',
          })
        }
      },
    }
  },
}

export default rule
