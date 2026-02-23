import { loadPandaData } from '../context'
import {
  buildFileState,
  getInvalidTokens,
  getTaggedTemplateCaller,
  isPandaAttribute,
  isPandaProp,
  isRecipeVariant,
} from '../helpers'
import { isIdentifier, isJSXExpressionContainer, isLiteral, isTemplateLiteral } from '../nodes'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

function isPandaIsh(name: string, data: Context, fileState: Context): boolean {
  if (fileState.pandaImports.length === 0) return false
  if (data.jsxFactory && name === data.jsxFactory) {
    return fileState.pandaImports.some((imp: Context) => imp.name === name || imp.alias === name)
  }
  return fileState.pandaImports.some((imp: Context) => imp.alias === name || imp.name === name)
}

export const noInvalidTokenPaths = {
  meta: {
    type: 'problem' as const,
    messages: {
      noInvalidTokenPaths: '`{{token}}` is an invalid token path.',
    },
    schema: [],
  },
  create(context: Context) {
    const configPath = context.settings?.['@pandacss/configPath']
    if (!configPath) return {}
    const data = loadPandaData(configPath)
    const fileState = buildFileState(context.sourceCode.ast, data)
    if (fileState.pandaImports.length === 0) return {}

    const invalidTokensCache = new Map<string, string[]>()

    const sendReport = (node: Context, value: string | undefined) => {
      if (!value) return

      let tokens: string[] | undefined = invalidTokensCache.get(value)
      if (!tokens) {
        tokens = getInvalidTokens(value, data)
        invalidTokensCache.set(value, tokens)
      }

      if (tokens.length === 0) return

      tokens.forEach((token: string) => {
        context.report({
          node,
          messageId: 'noInvalidTokenPaths',
          data: { token },
        })
      })
    }

    const handleLiteralOrTemplate = (node: Context) => {
      if (!node) return

      if (isLiteral(node)) {
        const value = node.value?.toString()
        sendReport(node, value)
      } else if (isTemplateLiteral(node) && node.expressions.length === 0) {
        const value = node.quasis[0].value.raw
        sendReport(node.quasis[0], value)
      }
    }

    return {
      JSXAttribute(node: Context) {
        if (!node.value || !isPandaProp(node, data, fileState)) return

        if (isLiteral(node.value)) {
          handleLiteralOrTemplate(node.value)
        } else if (isJSXExpressionContainer(node.value)) {
          handleLiteralOrTemplate(node.value.expression)
        }
      },

      Property(node: Context) {
        if (
          !isIdentifier(node.key) ||
          (!isLiteral(node.value) && !isTemplateLiteral(node.value)) ||
          !isPandaAttribute(node, data, fileState) ||
          isRecipeVariant(node, data, fileState)
        ) {
          return
        }

        handleLiteralOrTemplate(node.value)
      },

      TaggedTemplateExpression(node: Context) {
        const caller = getTaggedTemplateCaller(node)
        if (!caller || !isPandaIsh(caller, data, fileState)) return

        const quasis = node.quasi.quasis
        quasis.forEach((quasi: Context) => {
          const styles = quasi.value.raw
          if (!styles) return

          let tokens: string[] | undefined = invalidTokensCache.get(styles)
          if (!tokens) {
            tokens = getInvalidTokens(styles, data)
            invalidTokensCache.set(styles, tokens)
          }

          if (tokens.length === 0) return

          tokens.forEach((token: string) => {
            let index = styles.indexOf(token)

            while (index !== -1) {
              const start = quasi.range[0] + index + 1
              const end = start + token.length

              context.report({
                loc: {
                  start: context.sourceCode.getLocFromIndex(start),
                  end: context.sourceCode.getLocFromIndex(end),
                },
                messageId: 'noInvalidTokenPaths',
                data: { token },
              })

              index = styles.indexOf(token, index + token.length)
            }
          })
        })
      },
    }
  },
}
