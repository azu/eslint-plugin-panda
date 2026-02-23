import { loadPandaData } from '../context'
import { buildFileState, isInPandaFunction, isPandaAttribute, isPandaProp, isRecipeVariant } from '../helpers'
import {
  isArrayExpression,
  isIdentifier,
  isJSXExpressionContainer,
  isLiteral,
  isObjectExpression,
  isTemplateLiteral,
} from '../nodes'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

export const noDynamicStyling = {
  meta: {
    type: 'problem' as const,
    messages: {
      dynamic: 'Remove dynamic value. Prefer static styles.',
      dynamicProperty: 'Remove dynamic property. Prefer static style property.',
      dynamicRecipeVariant: 'Remove dynamic variant. Prefer static variant definition.',
    },
    schema: [],
  },
  create(context: Context) {
    const configPath = context.settings?.['@pandacss/configPath']
    if (!configPath) return {}
    const data = loadPandaData(configPath)
    const fileState = buildFileState(context.sourceCode.ast, data)
    if (fileState.pandaImports.length === 0) return {}

    function isStaticValue(node: Context): boolean {
      if (!node) return false
      if (isLiteral(node)) return true
      if (isTemplateLiteral(node) && node.expressions.length === 0) return true
      if (isObjectExpression(node)) return true
      return false
    }

    function checkArrayElements(array: Context) {
      array.elements.forEach((element: Context) => {
        if (!element) return
        if (isStaticValue(element)) return

        context.report({
          node: element,
          messageId: 'dynamic',
        })
      })
    }

    return {
      JSXAttribute(node: Context) {
        if (!node.value) return
        if (isLiteral(node.value)) return
        if (!isPandaProp(node, data, fileState)) return

        if (isJSXExpressionContainer(node.value)) {
          const expr = node.value.expression

          if (isStaticValue(expr)) return

          if (isArrayExpression(expr)) {
            checkArrayElements(expr)
            return
          }
        }

        context.report({
          node: node.value,
          messageId: 'dynamic',
        })
      },

      'Property[computed=true]'(node: Context) {
        if (!isInPandaFunction(node, data, fileState)) return

        context.report({
          node: node.key,
          messageId: isRecipeVariant(node, data, fileState) ? 'dynamicRecipeVariant' : 'dynamicProperty',
        })
      },

      Property(node: Context) {
        if (!isIdentifier(node.key)) return
        if (!isPandaAttribute(node, data, fileState)) return
        if (isRecipeVariant(node, data, fileState)) return

        if (isStaticValue(node.value)) return

        if (isArrayExpression(node.value)) {
          checkArrayElements(node.value)
          return
        }

        context.report({
          node: node.value,
          messageId: 'dynamic',
        })
      },
    }
  },
}
