import { loadPandaData } from '../context'
import {
  buildFileState,
  getAncestor,
  getImportSpecifiers,
  hasPkgImport,
  isPandaConfigFunction,
  isValidFile,
} from '../helpers'
import { isIdentifier, isVariableDeclaration } from '../nodes'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

const CONFIG_FUNCTIONS = new Set([
  'defineConfig',
  'defineRecipe',
  'defineSlotRecipe',
  'defineParts',
  'definePattern',
  'definePreset',
  'defineKeyframes',
  'defineGlobalStyles',
  'defineUtility',
  'defineTextStyles',
  'defineLayerStyles',
  'defineStyles',
  'defineTokens',
  'defineSemanticTokens',
])

export const noConfigFunctionInSource = {
  meta: {
    type: 'problem' as const,
    messages: {
      configFunction: 'Unnecessary `{{name}}` call. Config functions should only be used in the Panda config file.',
      delete: 'Delete `{{name}}` call.',
    },
    hasSuggestions: true,
    schema: [],
  },
  create(context: Context) {
    const configPath = context.settings?.['@pandacss/configPath']
    if (!configPath) return {}
    const data = loadPandaData(configPath)
    const fileState = buildFileState(context.sourceCode.ast, data)

    if (!hasPkgImport(fileState)) return {}

    const isPandaFile = isValidFile(data, context.filename)
    if (!isPandaFile) return {}

    return {
      CallExpression(node: Context) {
        if (!isIdentifier(node.callee)) return

        const functionName = node.callee.name

        if (!CONFIG_FUNCTIONS.has(functionName)) return
        if (!isPandaConfigFunction(fileState, functionName)) return

        context.report({
          node,
          messageId: 'configFunction',
          data: { name: functionName },
          suggest: [
            {
              messageId: 'delete',
              data: { name: functionName },
              fix(fixer: Context) {
                const declaration = getAncestor(isVariableDeclaration, node)
                const importSpecs = getImportSpecifiers(context.sourceCode.ast)

                const importSpec = importSpecs.find((s: Context) => s.specifier.local.name === functionName)

                const fixes = []

                if (declaration) {
                  fixes.push(fixer.remove(declaration))
                } else {
                  fixes.push(fixer.remove(node))
                }

                if (importSpec?.specifier) {
                  fixes.push(fixer.remove(importSpec.specifier))
                }

                return fixes
              },
            },
          ],
        })
      },
    }
  },
}
