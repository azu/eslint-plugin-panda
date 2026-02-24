import { loadPandaData } from '../context'
import { buildFileState, extractTokens, isPandaAttribute, isPandaProp, isRecipeVariant } from '../helpers'
import { isIdentifier, isJSXExpressionContainer, isJSXIdentifier, isLiteral, isTemplateLiteral } from '../nodes'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

export const RULE_NAME = 'no-hardcoded-color'

const rule = {
  meta: {
    type: 'problem' as const,
    messages: {
      invalidColor: '`{{color}}` is not a valid color token.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          noOpacity: { type: 'boolean' },
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

    const noOpacity = context.options[0]?.noOpacity
    const whitelist: string[] = context.options[0]?.whitelist ?? []

    const colorTokenCache = new Map<string, boolean>(whitelist.map((item: string) => [item, true]))

    const isColorToken = (token: string): boolean => {
      if (colorTokenCache.has(token)) return colorTokenCache.get(token)!
      // Check if token exists in the colors category of allTokenPaths
      const result = data.allTokenPaths.has(`colors.${token}`)
      colorTokenCache.set(token, result)
      return result
    }

    const isColorAttribute = (attribute: string): boolean => {
      const longhand = data.shorthandToLonghand.get(attribute) ?? attribute
      const category = data.propToCategory.get(longhand)
      return category === 'colors'
    }

    const isTokenFunctionUsed = (value: string): boolean => {
      if (!value) return false
      return extractTokens(value).length > 0
    }

    const isCssVariable = (value: string): boolean => {
      if (!value) return false
      return value.trim().startsWith('var(')
    }

    const isValidColorToken = (value: string): boolean => {
      if (!value) return false
      const [colorToken, opacity] = value.split('/')
      const hasOpacity = opacity !== undefined && opacity.length > 0
      const isValid = isColorToken(colorToken)
      return noOpacity ? isValid && !hasOpacity : isValid
    }

    const reportInvalidColor = (node: Context, color: string) => {
      context.report({ node, messageId: 'invalidColor', data: { color } })
    }

    const checkColorValue = (node: Context, value: string, attributeName: string) => {
      if (!isColorAttribute(attributeName)) return
      if (isTokenFunctionUsed(value)) return
      if (isCssVariable(value)) return
      if (isValidColorToken(value)) return
      reportInvalidColor(node, value)
    }

    return {
      JSXAttribute(node: Context) {
        if (!isJSXIdentifier(node.name)) return
        if (!isPandaProp(node, data, fileState) || !node.value) return

        const attributeName = node.name.name
        const valueNode = node.value

        if (isLiteral(valueNode)) {
          checkColorValue(valueNode, valueNode.value?.toString() || '', attributeName)
        } else if (isJSXExpressionContainer(valueNode)) {
          const expression = valueNode.expression
          if (isLiteral(expression)) {
            checkColorValue(expression, expression.value?.toString() || '', attributeName)
          } else if (isTemplateLiteral(expression) && expression.expressions.length === 0) {
            checkColorValue(expression.quasis[0], expression.quasis[0].value.raw, attributeName)
          }
        }
      },

      Property(node: Context) {
        if (!isIdentifier(node.key)) return
        if (!isPandaAttribute(node, data, fileState)) return
        if (isRecipeVariant(node, data, fileState)) return

        const attributeName = node.key.name
        const valueNode = node.value

        if (isLiteral(valueNode)) {
          checkColorValue(valueNode, valueNode.value?.toString() || '', attributeName)
        } else if (isTemplateLiteral(valueNode) && valueNode.expressions.length === 0) {
          checkColorValue(valueNode.quasis[0], valueNode.quasis[0].value.raw, attributeName)
        }
      },
    }
  },
}

export default rule
