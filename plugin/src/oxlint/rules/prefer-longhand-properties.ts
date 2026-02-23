import { loadPandaData, resolveLonghand } from '../context'
import { buildFileState, isPandaAttribute, isPandaProp, isRecipeVariant } from '../helpers'
import { isIdentifier, isJSXIdentifier } from '../nodes'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

export const preferLonghandProperties = {
  meta: {
    type: 'suggestion' as const,
    messages: {
      longhand: 'Use longhand property instead of `{{shorthand}}`. Prefer `{{longhand}}`.',
      replace: 'Replace `{{shorthand}}` with `{{longhand}}`.',
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
      if (!longhand || longhand === node.name) return

      const reportData = { shorthand: node.name, longhand }
      context.report({
        node,
        messageId: 'longhand',
        data: reportData,
        suggest: [
          {
            messageId: 'replace',
            data: reportData,
            fix: (fixer: Context) => fixer.replaceText(node, longhand),
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
