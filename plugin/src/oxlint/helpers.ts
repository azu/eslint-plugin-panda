import {
  isIdentifier,
  isLiteral,
  isTemplateLiteral,
  isCallExpression,
  isMemberExpression,
  isJSXMemberExpression,
  isJSXIdentifier,
  isJSXOpeningElement,
  isJSXExpressionContainer,
  isJSXAttribute,
  isImportDeclaration,
  isImportSpecifier,
} from './nodes'
import { matchImport } from './import-matcher'
import { type PandaData, type ImportResult, isValidProperty } from './context'
import micromatch from 'micromatch'
import path from 'node:path'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNode = any

export type FileState = {
  pandaImports: ImportResult[]
  allImports: ImportResult[]
  localStyledComponents: Set<string>
}

export function buildFileState(ast: AnyNode, data: PandaData): FileState {
  const allImports: ImportResult[] = []

  for (const node of ast.body) {
    if (!isImportDeclaration(node)) continue
    const mod = node.source.value
    if (!mod) continue

    for (const specifier of node.specifiers) {
      if (!isImportSpecifier(specifier)) continue
      allImports.push({
        name: specifier.imported.name,
        alias: specifier.local.name,
        mod,
      })
    }
  }

  const pandaImports = allImports.filter((imp) => matchImport(imp, data))

  // Find local styled components: const X = styled('div') or const X = styled.div({})
  const pandaFunctionAliases = new Set(pandaImports.map((i) => i.alias))
  const localStyledComponents = new Set<string>()

  for (const node of ast.body) {
    if (node.type !== 'VariableDeclaration') continue
    for (const decl of node.declarations) {
      if (decl.type !== 'VariableDeclarator') continue
      if (!decl.id || decl.id.type !== 'Identifier') continue
      if (!decl.init) continue

      const init = decl.init
      if (isCallExpression(init)) {
        if (isIdentifier(init.callee) && pandaFunctionAliases.has(init.callee.name)) {
          localStyledComponents.add(decl.id.name)
        }
        if (
          isMemberExpression(init.callee) &&
          isIdentifier(init.callee.object) &&
          pandaFunctionAliases.has(init.callee.object.name)
        ) {
          localStyledComponents.add(decl.id.name)
        }
      }
    }
  }

  return { pandaImports, allImports, localStyledComponents }
}

export function isValidFile(data: PandaData, fileName: string): boolean {
  const relativePath = path.isAbsolute(fileName) ? path.relative(data.cwd, fileName) : fileName
  return micromatch.isMatch(relativePath, data.include, { ignore: data.exclude, dot: true })
}

export function getAncestor(ofType: (node: AnyNode) => boolean, node: AnyNode): AnyNode | undefined {
  let current = node?.parent
  while (current) {
    if (ofType(current)) return current
    current = current.parent
  }
  return undefined
}

function isPandaIsh(name: string, data: PandaData, fileState: FileState): boolean {
  if (fileState.pandaImports.length === 0) return false
  if (data.jsxFactory && name === data.jsxFactory) {
    return fileState.pandaImports.some((imp) => imp.name === name || imp.alias === name)
  }
  // Check if any import maps this name to a panda file
  const file = fileState.pandaImports.filter(() => true) // use all panda imports
  return file.some((imp) => imp.alias === name || imp.name === name)
}

function isLocalStyledFactory(node: AnyNode, data: PandaData, fileState: FileState): boolean {
  if (!isJSXIdentifier(node.name)) return false
  return fileState.localStyledComponents.has(node.name.name)
}

export function isPandaProp(node: AnyNode, data: PandaData, fileState: FileState): boolean {
  const jsxAncestor = getAncestor(isJSXOpeningElement, node)
  if (!jsxAncestor) return false

  if (!isJSXMemberExpression(jsxAncestor.name) && !isJSXIdentifier(jsxAncestor.name)) return false

  const name = isJSXMemberExpression(jsxAncestor.name) ? jsxAncestor.name.object.name : jsxAncestor.name.name
  const prop = node.name.name

  const isPandaComponent = isPandaIsh(name, data, fileState) || isLocalStyledFactory(jsxAncestor, data, fileState)
  if (!isPandaComponent) return false

  const patternName = isJSXMemberExpression(jsxAncestor.name) ? undefined : name
  if (typeof prop !== 'string' || !isValidProperty(data, prop, patternName)) return false

  return true
}

export function isStyledProperty(node: AnyNode, data: PandaData, calleeName?: string): boolean {
  if (!isIdentifier(node.key) && !isLiteral(node.key) && !isTemplateLiteral(node.key)) return false

  if (isIdentifier(node.key) && !isValidProperty(data, node.key.name, calleeName)) return false
  if (isLiteral(node.key) && typeof node.key.value === 'string' && !isValidProperty(data, node.key.value, calleeName))
    return false
  if (isTemplateLiteral(node.key) && !isValidProperty(data, node.key.quasis[0].value.raw, calleeName)) return false

  return true
}

export function isInPandaFunction(node: AnyNode, data: PandaData, fileState: FileState): string | undefined {
  const callAncestor = getAncestor(isCallExpression, node)
  if (!callAncestor) return undefined

  let calleeName: string | undefined

  if (isIdentifier(callAncestor.callee)) {
    calleeName = callAncestor.callee.name
  }

  if (isMemberExpression(callAncestor.callee) && isIdentifier(callAncestor.callee.object)) {
    calleeName = callAncestor.callee.object.name
  }

  if (!calleeName) return undefined
  if (!isPandaIsh(calleeName, data, fileState)) return undefined

  return calleeName
}

export function isInJSXProp(node: AnyNode, data: PandaData, fileState: FileState): boolean {
  const jsxExprAncestor = getAncestor(isJSXExpressionContainer, node)
  const jsxAttrAncestor = getAncestor(isJSXAttribute, node)

  if (!jsxExprAncestor || !jsxAttrAncestor) return false
  if (!isPandaProp(jsxAttrAncestor, data, fileState)) return false
  if (typeof jsxAttrAncestor.name === 'string') return false
  if (!isJSXIdentifier(jsxAttrAncestor.name)) return false
  if (!isValidProperty(data, jsxAttrAncestor.name.name)) return false

  return true
}

export function isPandaAttribute(node: AnyNode, data: PandaData, fileState: FileState): boolean {
  const callAncestor = getAncestor(isCallExpression, node)

  if (callAncestor) {
    const callee = isInPandaFunction(node, data, fileState)
    if (!callee) return false
    return isStyledProperty(node, data, callee)
  }

  return isInJSXProp(node, data, fileState) && isStyledProperty(node, data)
}

export function isRecipeVariant(node: AnyNode, data: PandaData, fileState: FileState): boolean {
  const caller = isInPandaFunction(node, data, fileState)
  if (!caller) return false

  const recipe = fileState.pandaImports.find((imp) => ['cva', 'sva'].includes(imp.name) && imp.alias === caller)
  if (!recipe) return false

  let currentNode: AnyNode = node
  let length = 0
  let styleObjectParent: string | null = null

  while (currentNode) {
    const keyName = currentNode?.key?.name
    if (keyName && ['base', 'variants'].includes(keyName)) {
      styleObjectParent = keyName
    }
    currentNode = currentNode.parent
    if (!styleObjectParent) length++
  }

  const isCvaCaller = caller === 'cva'
  const requiredLength = isCvaCaller ? 2 : 4
  const extraLength = styleObjectParent === 'base' ? 0 : 4

  if (length < requiredLength + extraLength) return true

  return false
}

export function getTaggedTemplateCaller(node: AnyNode): string | undefined {
  if (isIdentifier(node.tag)) {
    return node.tag.name
  }
  if (isMemberExpression(node.tag)) {
    if (!isIdentifier(node.tag.object)) return undefined
    return node.tag.object.name
  }
  if (isCallExpression(node.tag)) {
    if (!isIdentifier(node.tag.callee)) return undefined
    return node.tag.callee.name
  }
  return undefined
}

export function getTokenImport(fileState: FileState): ImportResult | undefined {
  return fileState.allImports.find((imp) => imp.name === 'token')
}

// Re-exported from the original helpers — pure function, no dependencies
export function extractTokens(value: string): string[] {
  const regex = /token\(([^"'(),]+)(?:,\s*([^"'(),]+))?\)|\{([^{\r\n}]+)\}/g
  const matches: string[] = []
  let match

  while ((match = regex.exec(value)) !== null) {
    const tokenFromFirstSyntax = match[1] || match[2] || match[3]
    const tokensFromSecondSyntax = match[4] && match[4].match(/(\w+\.\w+(\.\w+)?)/g)

    if (tokenFromFirstSyntax) {
      matches.push(tokenFromFirstSyntax)
    }

    if (tokensFromSecondSyntax) {
      matches.push(...tokensFromSecondSyntax)
    }
  }

  return matches.filter(Boolean)
}

export function getInvalidTokens(value: string, data: PandaData): string[] {
  const tokens = extractTokens(value)
  if (!tokens.length) return []
  return tokens.filter((token) => !data.allTokenPaths.has(token))
}

export function getDeprecatedTokens(
  prop: string,
  value: string,
  data: PandaData,
): (string | { category: string; value: string })[] {
  const propCategory = getPropCategory(data, prop)
  const tokens = extractTokens(value)

  if (!propCategory && !tokens.length) return []

  const values: (string | { category: string; value: string })[] = tokens.length
    ? tokens
    : [{ category: propCategory ?? '', value: value.split('/')[0] }]

  return values.filter((token) => {
    const tokenPath = typeof token === 'string' ? token : token.category + '.' + token.value
    return data.deprecatedTokenPaths.has(tokenPath)
  })
}

function getPropCategory(data: PandaData, prop: string): string | undefined {
  const longhand = data.shorthandToLonghand.get(prop) ?? prop
  return data.propToCategory.get(longhand)
}

export function hasPkgImport(fileState: FileState): boolean {
  return fileState.allImports.some(({ mod }) => mod === '@pandacss/dev')
}

export function isPandaConfigFunction(fileState: FileState, name: string): boolean {
  return fileState.allImports.some(({ alias, mod }) => alias === name && mod === '@pandacss/dev')
}

export function getImportSpecifiers(ast: AnyNode): { specifier: AnyNode; mod: string }[] {
  const specifiers: { specifier: AnyNode; mod: string }[] = []

  for (const node of ast.body) {
    if (!isImportDeclaration(node)) continue
    const mod = node.source.value
    if (!mod) continue

    for (const specifier of node.specifiers) {
      if (!isImportSpecifier(specifier)) continue
      specifiers.push({ specifier, mod })
    }
  }

  return specifiers
}
