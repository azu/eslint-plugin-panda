// Node type guards without @typescript-eslint/utils dependency
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNode = any

export const isIdentifier = (node: AnyNode): boolean => node?.type === 'Identifier'
export const isLiteral = (node: AnyNode): boolean => node?.type === 'Literal'
export const isTemplateLiteral = (node: AnyNode): boolean => node?.type === 'TemplateLiteral'
export const isArrayExpression = (node: AnyNode): boolean => node?.type === 'ArrayExpression'
export const isObjectExpression = (node: AnyNode): boolean => node?.type === 'ObjectExpression'
export const isMemberExpression = (node: AnyNode): boolean => node?.type === 'MemberExpression'
export const isVariableDeclarator = (node: AnyNode): boolean => node?.type === 'VariableDeclarator'
export const isVariableDeclaration = (node: AnyNode): boolean => node?.type === 'VariableDeclaration'
export const isJSXMemberExpression = (node: AnyNode): boolean => node?.type === 'JSXMemberExpression'
export const isJSXOpeningElement = (node: AnyNode): boolean => node?.type === 'JSXOpeningElement'
export const isJSXExpressionContainer = (node: AnyNode): boolean => node?.type === 'JSXExpressionContainer'
export const isJSXAttribute = (node: AnyNode): boolean => node?.type === 'JSXAttribute'
export const isJSXIdentifier = (node: AnyNode): boolean => node?.type === 'JSXIdentifier'
export const isCallExpression = (node: AnyNode): boolean => node?.type === 'CallExpression'
export const isImportDeclaration = (node: AnyNode): boolean => node?.type === 'ImportDeclaration'
export const isImportSpecifier = (node: AnyNode): boolean => node?.type === 'ImportSpecifier'
export const isProperty = (node: AnyNode): boolean => node?.type === 'Property'
