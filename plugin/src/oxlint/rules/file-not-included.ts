import { loadPandaData } from '../context'
import { buildFileState, isValidFile } from '../helpers'
import { matchImport } from '../import-matcher'
import { isImportDeclaration } from '../nodes'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any

export const fileNotIncluded = {
  meta: {
    type: 'problem' as const,
    messages: {
      include:
        'The use of Panda CSS is not allowed in this file. Please ensure the file is included in the Panda CSS `include` configuration.',
    },
    schema: [],
  },
  create(context: Context) {
    const configPath = context.settings?.['@pandacss/configPath']
    if (!configPath) return {}
    const data = loadPandaData(configPath)

    const isFileIncluded = isValidFile(data, context.filename)
    if (isFileIncluded) return {}

    const fileState = buildFileState(context.sourceCode.ast, data)

    let hasReported = false

    return {
      ImportDeclaration(node: Context) {
        if (hasReported) return
        if (!isImportDeclaration(node)) return

        const mod = node.source.value
        const isPandaImport = fileState.pandaImports.some((imp: Context) => imp.mod === mod)
        if (!isPandaImport) return

        context.report({
          node,
          messageId: 'include',
        })

        hasReported = true
      },
    }
  },
}
