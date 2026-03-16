import type * as Monaco from 'monaco-editor'

export interface TokenDef {
  id: string
  label: string
  description: string
  token: string       // monarch token name (postfix .typst added automatically)
  defaultColor: string
  fontStyle: string   // fixed — not user-configurable to keep things simple
}

export const TOKEN_DEFS: TokenDef[] = [
  {
    id: 'heading',
    label: 'Heading',
    description: '= Title, == Section…',
    token: 'heading',
    defaultColor: '#1d4ed8',
    fontStyle: 'bold'
  },
  {
    id: 'keyword',
    label: 'Keyword',
    description: '#set, #let, #show, #if…',
    token: 'keyword',
    defaultColor: '#7c3aed',
    fontStyle: 'bold'
  },
  {
    id: 'function',
    label: 'Function',
    description: '#name, #rect, #align…',
    token: 'function',
    defaultColor: '#0369a1',
    fontStyle: ''
  },
  {
    id: 'bold',
    label: 'Bold text',
    description: '*bold*',
    token: 'bold',
    defaultColor: '#111827',
    fontStyle: 'bold'
  },
  {
    id: 'italic',
    label: 'Italic text',
    description: '_italic_',
    token: 'italic',
    defaultColor: '#374151',
    fontStyle: 'italic'
  },
  {
    id: 'string',
    label: 'String',
    description: '"text"',
    token: 'string',
    defaultColor: '#059669',
    fontStyle: ''
  },
  {
    id: 'number',
    label: 'Number / Unit',
    description: '12pt, 50%, 1.5em…',
    token: 'number',
    defaultColor: '#b45309',
    fontStyle: ''
  },
  {
    id: 'comment',
    label: 'Comment',
    description: '// line  /* block */',
    token: 'comment',
    defaultColor: '#9ca3af',
    fontStyle: 'italic'
  },
  {
    id: 'math',
    label: 'Math',
    description: '$x^2 + y^2$',
    token: 'math',
    defaultColor: '#c2410c',
    fontStyle: ''
  },
  {
    id: 'raw',
    label: 'Raw / Code',
    description: '`inline`  ```block```',
    token: 'raw',
    defaultColor: '#0f766e',
    fontStyle: ''
  },
  {
    id: 'label',
    label: 'Label',
    description: '<fig:one>',
    token: 'label',
    defaultColor: '#7e22ce',
    fontStyle: ''
  },
  {
    id: 'reference',
    label: 'Reference',
    description: '@fig:one',
    token: 'reference',
    defaultColor: '#be185d',
    fontStyle: ''
  },
  {
    id: 'list',
    label: 'List marker',
    description: '-, +, 1.',
    token: 'list',
    defaultColor: '#2563eb',
    fontStyle: 'bold'
  },
  {
    id: 'escape',
    label: 'Escape',
    description: '\\* \\_ \\#…',
    token: 'escape',
    defaultColor: '#6b7280',
    fontStyle: ''
  },
  {
    id: 'rule',
    label: 'Horizontal rule',
    description: '---',
    token: 'rule',
    defaultColor: '#d1d5db',
    fontStyle: ''
  }
]

export type TokenColors = Record<string, string>  // id → hex color

export const DEFAULT_TOKEN_COLORS: TokenColors = Object.fromEntries(
  TOKEN_DEFS.map(d => [d.id, d.defaultColor])
)

const EDITOR_UI_COLORS = {
  'editor.background': '#f5f8ff00',
  'editor.foreground': '#1a1d2e',
  'editorLineNumber.foreground': '#c4c9d6',
  'editorLineNumber.activeForeground': '#6b7280',
  'editor.lineHighlightBackground': '#0000000a',
  'editor.selectionBackground': '#2563eb26',
  'editor.inactiveSelectionBackground': '#2563eb14',
  'editorCursor.foreground': '#2563eb',
  'editorWhitespace.foreground': '#e5e7eb',
  'editorIndentGuide.background1': '#e5e7eb',
  'editorIndentGuide.activeBackground1': '#d1d5db',
  'scrollbarSlider.background': '#00000018',
  'scrollbarSlider.hoverBackground': '#00000030',
  'scrollbarSlider.activeBackground': '#00000040',
}

export function buildMonacoTheme(
  colors: TokenColors
): Monaco.editor.IStandaloneThemeData {
  const rules: Monaco.editor.ITokenThemeRule[] = TOKEN_DEFS.map(def => ({
    token: `${def.token}.typst`,
    foreground: (colors[def.id] ?? def.defaultColor).replace('#', ''),
    fontStyle: def.fontStyle
  }))

  return {
    base: 'vs',
    inherit: true,
    rules,
    colors: EDITOR_UI_COLORS
  }
}
