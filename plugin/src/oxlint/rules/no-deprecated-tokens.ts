import { loadPandaData, type DeprecatedToken } from '../context'
import {
  buildFileState,
  getDeprecatedTokens,
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

export const noDeprecatedTokens = {
  meta: {
    type: 'problem' as const,
    messages: {
      noDeprecatedTokenPaths: '`{{token}}` is a deprecated token.',
      noDeprecatedTokens: '`{{token}}` is a deprecated {{category}} token.',
    },
    schema: [],
  },
  create(context: Context) {
    const configPath = context.settings?.['@pandacss/configPath']
    if (!configPath) return {}
    const data = loadPandaData(configPath)
    const fileState = buildFileState(context.sourceCode.ast, data)
    if (fileState.pandaImports.length === 0) return {}

    const deprecatedTokensCache = new Map<string, DeprecatedToken[]>()

    const sendReport = (prop: string, node: Context, value: string | undefined) => {
      if (!value) return

      let tokens: DeprecatedToken[] | undefined = deprecatedTokensCache.get(value)
      if (!tokens) {
        tokens = getDeprecatedTokens(prop, value, data)
        deprecatedTokensCache.set(value, tokens)
      }

      if (tokens.length === 0) return

      tokens.forEach((token: DeprecatedToken) => {
        context.report({
          node,
          messageId: typeof token === 'string' ? 'noDeprecatedTokenPaths' : 'noDeprecatedTokens',
          data: {
            token: typeof token === 'string' ? token : token.value,
            category: typeof token === 'string' ? undefined : token.category,
          },
        })
      })
    }

    const handleLiteralOrTemplate = (prop: string, node: Context) => {
      if (!node) return

      if (isLiteral(node)) {
        const value = node.value?.toString()
        sendReport(prop, node, value)
      } else if (isTemplateLiteral(node) && node.expressions.length === 0) {
        const value = node.quasis[0].value.raw
        sendReport(prop, node.quasis[0], value)
      }
    }

    return {
      JSXAttribute(node: Context) {
        if (!node.value || !isPandaProp(node, data, fileState)) return

        const prop = node.name.name as string

        if (isLiteral(node.value)) {
          handleLiteralOrTemplate(prop, node.value)
        } else if (isJSXExpressionContainer(node.value)) {
          handleLiteralOrTemplate(prop, node.value.expression)
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

        const prop = node.key.name as string

        handleLiteralOrTemplate(prop, node.value)
      },

      TaggedTemplateExpression(node: Context) {
        const caller = getTaggedTemplateCaller(node)
        if (!caller || !isPandaIsh(caller, data, fileState)) return

        const quasis = node.quasi.quasis
        quasis.forEach((quasi: Context) => {
          const styles = quasi.value.raw
          if (!styles) return

          let tokens: DeprecatedToken[] | undefined = deprecatedTokensCache.get(styles)
          if (!tokens) {
            tokens = getDeprecatedTokens('', styles, data)
            deprecatedTokensCache.set(styles, tokens)
          }

          if (tokens.length === 0) return

          tokens.forEach((token: DeprecatedToken) => {
            const tokenValue = typeof token === 'string' ? token : token.value
            let index = styles.indexOf(tokenValue)

            while (index !== -1) {
              const start = quasi.range[0] + index + 1
              const end = start + tokenValue.length

              context.report({
                loc: {
                  start: context.sourceCode.getLocFromIndex(start),
                  end: context.sourceCode.getLocFromIndex(end),
                },
                messageId: typeof token === 'string' ? 'noDeprecatedTokenPaths' : 'noDeprecatedTokens',
                data: {
                  token: tokenValue,
                  category: typeof token === 'string' ? undefined : token.category,
                },
              })

              index = styles.indexOf(tokenValue, index + tokenValue.length)
            }
          })
        })
      },
    }
  },
}
