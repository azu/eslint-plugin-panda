import { loadPandaData } from '../context'
import { buildFileState, isPandaAttribute, isPandaProp, isRecipeVariant } from '../helpers'
import { isIdentifier, isJSXExpressionContainer, isMemberExpression } from '../nodes'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

export const RULE_NAME = 'no-property-renaming'

const rule = {
  meta: {
    type: 'problem' as const,
    messages: {
      noRenaming:
        'Incoming `{{prop}}` prop is different from the expected `{{expected}}` attribute. Panda will not track this prop.',
    },
    schema: [],
  },
  create(context: Context) {
    const configPath = context.settings?.['@pandacss/configPath']
    if (!configPath) return {}
    const data = loadPandaData(configPath)
    const fileState = buildFileState(context.sourceCode.ast, data)
    if (fileState.pandaImports.length === 0) return {}

    const sendReport = (node: Context, expected: string, prop: string) => {
      context.report({
        node,
        messageId: 'noRenaming',
        data: { expected, prop },
      })
    }

    const handleReport = (node: Context, value: Context, attr: string) => {
      if (isIdentifier(value) && attr !== value.name) {
        sendReport(node, attr, value.name)
      } else if (isMemberExpression(value) && isIdentifier(value.property) && attr !== value.property.name) {
        sendReport(node, attr, value.property.name)
      }
    }

    return {
      JSXAttribute(node: Context) {
        if (!node.value) return
        if (!isJSXExpressionContainer(node.value)) return
        if (!isPandaProp(node, data, fileState)) return

        const attr = node.name.name.toString()
        const expression = node.value.expression

        handleReport(node.value, expression, attr)
      },

      Property(node: Context) {
        if (!isIdentifier(node.key)) return
        if (!isIdentifier(node.value) && !isMemberExpression(node.value)) return
        if (!isPandaAttribute(node, data, fileState)) return
        if (isRecipeVariant(node, data, fileState)) return

        const attr = node.key.name
        const value = node.value

        handleReport(node.value, value, attr)
      },
    }
  },
}

export default rule
