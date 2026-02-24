import { loadPandaData, isValidProperty as isValidProp, resolveLonghand } from '../context'
import { buildFileState, isPandaAttribute, isPandaProp, isRecipeVariant } from '../helpers'
import { isIdentifier, isJSXIdentifier } from '../nodes'
import { compositeProperties } from '../../utils/composite-properties'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

export const RULE_NAME = 'prefer-composite-properties'

const rule = {
  meta: {
    type: 'suggestion' as const,
    messages: {
      composite: 'Use composite property instead of `{{atomic}}`. Prefer: `{{composite}}`.',
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

    const compositePropertyCache = new Map<string, string | undefined>()

    const resolveCompositeProperty = (name: string): string | undefined => {
      if (compositePropertyCache.has(name)) return compositePropertyCache.get(name)

      const longhand = getLonghand(name)

      if (!isValidProp(data, longhand)) {
        compositePropertyCache.set(name, undefined)
        return undefined
      }

      const composite = Object.keys(compositeProperties).find((cpd) => compositeProperties[cpd].includes(longhand))

      compositePropertyCache.set(name, composite)
      return composite
    }

    const sendReport = (node: Context, composite: string) => {
      if (whitelist.includes(node.name)) return
      context.report({
        node,
        messageId: 'composite',
        data: { composite, atomic: node.name },
      })
    }

    return {
      JSXAttribute(node: Context) {
        if (!isJSXIdentifier(node.name)) return
        if (!isPandaProp(node, data, fileState)) return
        const composite = resolveCompositeProperty(node.name.name)
        if (!composite) return
        sendReport(node.name, composite)
      },

      Property(node: Context) {
        if (!isIdentifier(node.key)) return
        if (!isPandaAttribute(node, data, fileState)) return
        if (isRecipeVariant(node, data, fileState)) return
        const composite = resolveCompositeProperty(node.key.name)
        if (!composite) return
        sendReport(node.key, composite)
      },
    }
  },
}

export default rule
