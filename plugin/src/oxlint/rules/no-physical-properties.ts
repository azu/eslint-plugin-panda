import { loadPandaData, resolveLonghand } from '../context'
import { buildFileState, isPandaAttribute, isPandaProp, isRecipeVariant } from '../helpers'
import { isIdentifier, isJSXExpressionContainer, isJSXIdentifier, isLiteral } from '../nodes'
import { physicalProperties, physicalPropertyValues } from '../../utils/physical-properties'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

export const noPhysicalProperties = {
  meta: {
    type: 'suggestion' as const,
    messages: {
      physical: 'Use logical property instead of {{physical}}. Prefer `{{logical}}`.',
      physicalValue: 'Use logical value instead of {{physical}}. Prefer `{{logical}}`.',
      replace: 'Replace `{{physical}}` with `{{logical}}`.',
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
    const longhandCache = new Map<string, string>()

    const getLonghand = (name: string): string => {
      if (longhandCache.has(name)) return longhandCache.get(name)!
      const longhand = resolveLonghand(data, name) ?? name
      longhandCache.set(name, longhand)
      return longhand
    }

    const extractStringLiteralValue = (valueNode: Context): string | null => {
      if (isLiteral(valueNode) && typeof valueNode.value === 'string') {
        return valueNode.value
      }
      if (
        isJSXExpressionContainer(valueNode) &&
        isLiteral(valueNode.expression) &&
        typeof valueNode.expression.value === 'string'
      ) {
        return valueNode.expression.value
      }
      return null
    }

    const checkPropertyName = (node: Context) => {
      if (whitelist.includes(node.name)) return
      const longhandName = getLonghand(node.name)
      if (!(longhandName in physicalProperties)) return

      const logical = physicalProperties[longhandName]
      const physicalName = `\`${node.name}\`${longhandName !== node.name ? ` (resolved to \`${longhandName}\`)` : ''}`

      context.report({
        node,
        messageId: 'physical',
        data: { physical: physicalName, logical },
        suggest: [
          {
            messageId: 'replace',
            data: { physical: node.name, logical },
            fix: (fixer: Context) => fixer.replaceText(node, logical),
          },
        ],
      })
    }

    const checkPropertyValue = (keyNode: Context, valueNode: Context): boolean => {
      const propName = keyNode.name
      if (!(propName in physicalPropertyValues)) return false

      const valueText = extractStringLiteralValue(valueNode)
      if (valueText === null) return false

      const valueMap = physicalPropertyValues[propName]
      if (!valueMap[valueText]) return false

      context.report({
        node: valueNode,
        messageId: 'physicalValue',
        data: { physical: `"${valueText}"`, logical: `"${valueMap[valueText]}"` },
        suggest: [
          {
            messageId: 'replace',
            data: { physical: `"${valueText}"`, logical: `"${valueMap[valueText]}"` },
            fix: (fixer: Context) => {
              if (isLiteral(valueNode)) {
                return fixer.replaceText(valueNode, `"${valueMap[valueText]}"`)
              }
              if (isJSXExpressionContainer(valueNode) && isLiteral(valueNode.expression)) {
                return fixer.replaceText(valueNode.expression, `"${valueMap[valueText]}"`)
              }
              return null
            },
          },
        ],
      })
      return true
    }

    return {
      JSXAttribute(node: Context) {
        if (!isJSXIdentifier(node.name)) return
        if (!isPandaProp(node, data, fileState)) return

        checkPropertyName(node.name)
        if (node.value) {
          checkPropertyValue(node.name, node.value)
        }
      },

      Property(node: Context) {
        if (!isIdentifier(node.key)) return
        if (!isPandaAttribute(node, data, fileState)) return
        if (isRecipeVariant(node, data, fileState)) return

        checkPropertyName(node.key)
        if (node.value) {
          checkPropertyValue(node.key, node.value)
        }
      },
    }
  },
}
