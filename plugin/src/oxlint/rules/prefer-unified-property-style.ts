import { loadPandaData, isValidProperty as isValidProp, resolveLonghand } from '../context'
import { buildFileState, isPandaAttribute, isPandaProp, isRecipeVariant } from '../helpers'
import { isIdentifier, isJSXIdentifier, isJSXOpeningElement, isObjectExpression } from '../nodes'
import { compositeProperties } from '../../utils/composite-properties'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

export const RULE_NAME = 'prefer-unified-property-style'

const rule = {
  meta: {
    type: 'suggestion' as const,
    messages: {
      unify:
        "You're mixing atomic {{atomicProperties}} with composite property `{{composite}}`. Prefer atomic styling to mixing atomic and composite properties. Remove `{{composite}}` and use one or more of {{atomics}} instead.",
    },
    schema: [],
  },
  create(context: Context) {
    const configPath = context.settings?.['@pandacss/configPath']
    if (!configPath) return {}
    const data = loadPandaData(configPath)
    const fileState = buildFileState(context.sourceCode.ast, data)
    if (fileState.pandaImports.length === 0) return {}

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

      if (name in compositeProperties) {
        compositePropertyCache.set(name, name)
        return name
      }

      const longhand = getLonghand(name)
      if (isValidProp(data, longhand) && longhand in compositeProperties) {
        compositePropertyCache.set(name, longhand)
        return longhand
      }

      compositePropertyCache.set(name, undefined)
      return undefined
    }

    const sendReport = (node: Context, composite: string, siblings: string[]) => {
      const atomicPropertiesSet = new Set(
        siblings.filter((prop: string) => compositeProperties[composite].includes(getLonghand(prop))),
      )

      if (atomicPropertiesSet.size === 0) return

      const atomicProperties = Array.from(atomicPropertiesSet)
        .map((prop) => `\`${prop}\``)
        .join(', ')

      const atomics = compositeProperties[composite].map((name: string) => `\`${name}\``).join(', ')

      context.report({
        node,
        messageId: 'unify',
        data: { composite, atomicProperties, atomics },
      })
    }

    return {
      JSXAttribute(node: Context) {
        if (!isJSXIdentifier(node.name)) return
        if (!isPandaProp(node, data, fileState)) return

        const composite = resolveCompositeProperty(node.name.name)
        if (!composite) return
        if (!isJSXOpeningElement(node.parent)) return

        const siblings = node.parent.attributes.map((attr: Context) => attr.name?.name).filter(Boolean)

        sendReport(node, composite, siblings)
      },

      Property(node: Context) {
        if (!isIdentifier(node.key)) return
        if (!isPandaAttribute(node, data, fileState)) return
        if (isRecipeVariant(node, data, fileState)) return

        const composite = resolveCompositeProperty(node.key.name)
        if (!composite) return
        if (!isObjectExpression(node.parent)) return

        const siblings = node.parent.properties
          .filter((prop: Context) => prop.type === 'Property')
          .map((prop: Context) => (isIdentifier(prop.key) ? prop.key.name : ''))

        sendReport(node.key, composite, siblings)
      },
    }
  },
}

export default rule
