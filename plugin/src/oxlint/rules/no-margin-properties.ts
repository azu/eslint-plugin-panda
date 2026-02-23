import { loadPandaData, resolveLonghand } from '../context'
import { buildFileState, isPandaAttribute, isPandaProp, isRecipeVariant } from '../helpers'
import { isIdentifier, isJSXIdentifier } from '../nodes'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

export const noMarginProperties = {
  meta: {
    type: 'suggestion' as const,
    messages: {
      noMargin:
        'Use flex or grid with the `gap` property to define spacing in parent elements for a more resilient layout.',
    },
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
    const longhandCache = new Map<string, string>()

    const getLonghand = (name: string): string => {
      if (longhandCache.has(name)) return longhandCache.get(name)!
      const longhand = resolveLonghand(data, name) ?? name
      longhandCache.set(name, longhand)
      return longhand
    }

    const marginRegex = /margin/i
    const isMarginProperty = (name: string): boolean => marginRegex.test(getLonghand(name).toLowerCase())

    const sendReport = (node: Context) => {
      if (whitelist.includes(node.name)) return
      if (!isMarginProperty(node.name)) return
      context.report({ node, messageId: 'noMargin' })
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
