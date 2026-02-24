import { loadPandaData } from '../context'
import { buildFileState, isPandaAttribute, isPandaProp, isRecipeVariant } from '../helpers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

export const RULE_NAME = 'no-debug'

const rule = {
  meta: {
    type: 'problem' as const,
    messages: {
      debug: 'Unnecessary debug utility.',
      prop: 'Remove the debug prop.',
      property: 'Remove the debug property.',
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

    return {
      'JSXAttribute[name.name="debug"]'(node: Context) {
        if (!isPandaProp(node, data, fileState)) return

        context.report({
          node,
          messageId: 'debug',
          suggest: [
            {
              messageId: 'prop',
              fix: (fixer: Context) => fixer.remove(node),
            },
          ],
        })
      },

      'Property[key.name="debug"]'(node: Context) {
        if (!isPandaAttribute(node, data, fileState)) return
        if (isRecipeVariant(node, data, fileState)) return

        context.report({
          node: node.key,
          messageId: 'debug',
          suggest: [
            {
              messageId: 'property',
              fix: (fixer: Context) => fixer.removeRange([node.range[0], node.range[1] + 1]),
            },
          ],
        })
      },
    }
  },
}

export default rule
