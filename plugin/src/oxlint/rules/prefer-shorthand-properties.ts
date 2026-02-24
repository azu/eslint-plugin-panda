import { loadPandaData, resolveLonghand } from '../context'
import { buildFileState, isPandaAttribute, isPandaProp, isRecipeVariant } from '../helpers'
import { isIdentifier, isJSXIdentifier } from '../nodes'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

export const RULE_NAME = 'prefer-shorthand-properties'

const rule = {
  meta: {
    type: 'suggestion' as const,
    messages: {
      shorthand: 'Use shorthand property instead of `{{longhand}}`. Prefer `{{shorthand}}`.',
      replace: 'Replace `{{longhand}}` with `{{shorthand}}`.',
    },
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          whitelist: {
            type: 'array',
            items: { type: 'string', minLength: 0 },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context: Context) {
    const configPath = context.settings?.['@pandacss/configPath']
    if (!configPath) return {}
    const data = loadPandaData(configPath)
    const fileState = buildFileState(context.sourceCode.ast, data)
    if (fileState.pandaImports.length === 0) return {}

    const whitelist: string[] = context.options[0]?.whitelist ?? []

    const sendReport = (node: Context) => {
      if (whitelist.includes(node.name)) return
      const longhand = resolveLonghand(data, node.name)
      if (longhand) return // already a shorthand

      const shorthands = data.longhandToShorthands.get(node.name)
      if (!shorthands || shorthands.length === 0) return

      const shorthandList = shorthands.map((s: string) => `\`${s}\``).join(', ')
      const reportData = { longhand: node.name, shorthand: shorthandList }

      context.report({
        node,
        messageId: 'shorthand',
        data: reportData,
        suggest: [
          {
            messageId: 'replace',
            data: reportData,
            fix: (fixer: Context) => fixer.replaceText(node, shorthands[0]),
          },
        ],
      })
    }

    return {
      JSXAttribute(node: Context) {
        if (!isJSXIdentifier(node.name)) return
        if (!isPandaProp(node, data, fileState)) return
        sendReport(node.name)
      },

      Property(node: Context) {
        if (!isIdentifier(node.key)) return
        if (!isPandaAttribute(node, data, fileState)) return
        if (isRecipeVariant(node, data, fileState)) return
        sendReport(node.key)
      },
    }
  },
}

export default rule
