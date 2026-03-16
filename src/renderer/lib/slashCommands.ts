export interface SlashCommand {
  id: string
  label: string
  description: string
  icon: string
  category: 'headings' | 'text' | 'structure' | 'media' | 'advanced'
  snippet: string
  keywords: string[]
}

export const SLASH_COMMANDS: SlashCommand[] = [
  // Headings
  { id: 'h1', label: 'Heading 1', description: 'Large section title', icon: 'H1', category: 'headings', snippet: '= $1\n$0', keywords: ['h1', 'heading', 'title', 'section'] },
  { id: 'h2', label: 'Heading 2', description: 'Medium subsection', icon: 'H2', category: 'headings', snippet: '== $1\n$0', keywords: ['h2', 'heading', 'subtitle', 'subsection'] },
  { id: 'h3', label: 'Heading 3', description: 'Small subsection', icon: 'H3', category: 'headings', snippet: '=== $1\n$0', keywords: ['h3', 'heading', 'sub'] },

  // Text
  { id: 'bold', label: 'Bold', description: '*bold text*', icon: 'B', category: 'text', snippet: '*${1:bold}*$0', keywords: ['bold', 'strong', 'b'] },
  { id: 'italic', label: 'Italic', description: '_italic text_', icon: 'I', category: 'text', snippet: '_${1:italic}_$0', keywords: ['italic', 'em', 'i'] },
  { id: 'link', label: 'Link', description: 'Hyperlink with label', icon: '↗', category: 'text', snippet: '#link("${1:https://}")[$2]$0', keywords: ['link', 'url', 'href', 'a'] },
  { id: 'highlight', label: 'Highlight', description: 'Highlighted text', icon: '◐', category: 'text', snippet: '#highlight[${1:text}]$0', keywords: ['highlight', 'mark'] },
  { id: 'strike', label: 'Strikethrough', description: 'Struck-out text', icon: 'S̶', category: 'text', snippet: '#strike[${1:text}]$0', keywords: ['strike', 'strikethrough', 'del'] },

  // Structure
  { id: 'bullet', label: 'Bullet list', description: 'Unordered list', icon: '•', category: 'structure', snippet: '- $1\n- $2\n- $0', keywords: ['list', 'bullet', 'ul', 'unordered'] },
  { id: 'numbered', label: 'Numbered list', description: 'Ordered list', icon: '1.', category: 'structure', snippet: '+ $1\n+ $2\n+ $0', keywords: ['numbered', 'ordered', 'ol'] },
  { id: 'table', label: 'Table', description: '3-column table', icon: '⊞', category: 'structure', snippet: '#table(\n  columns: (${1:1fr}, ${2:1fr}, ${3:1fr}),\n  [${4:Header}], [${5:Header}], [${6:Header}],\n  [${7:Cell}], [${8:Cell}], [$0],\n)', keywords: ['table', 'grid', 'data'] },
  { id: 'columns', label: 'Columns', description: 'Multi-column layout', icon: '⫴', category: 'structure', snippet: '#columns(${1:2})[\n  $0\n]', keywords: ['columns', 'layout'] },
  { id: 'hrule', label: 'Divider', description: 'Horizontal rule', icon: '—', category: 'structure', snippet: '---\n$0', keywords: ['divider', 'rule', 'hr', 'line', 'separator'] },
  { id: 'pagebreak', label: 'Page break', description: 'Force a new page', icon: '⤓', category: 'structure', snippet: '#pagebreak()\n$0', keywords: ['page', 'break', 'newpage'] },

  // Media
  { id: 'image', label: 'Image', description: 'Figure with caption', icon: '⬚', category: 'media', snippet: '#figure(\n  image("${1:path/to/image.png}", width: ${2:80%}),\n  caption: [$3],\n)\n$0', keywords: ['image', 'figure', 'picture', 'photo', 'img'] },
  { id: 'code', label: 'Code block', description: 'Fenced code', icon: '</>', category: 'media', snippet: '```${1:language}\n$2\n```\n$0', keywords: ['code', 'codeblock', 'raw', 'fence'] },
  { id: 'math', label: 'Math', description: 'Inline equation', icon: '∑', category: 'media', snippet: '$${1:x^2}$$0', keywords: ['math', 'equation', 'formula', 'latex'] },
  { id: 'quote', label: 'Quote', description: 'Block quote', icon: '"', category: 'media', snippet: '#quote(attribution: [$1])[\n  $2\n]\n$0', keywords: ['quote', 'blockquote', 'cite'] },

  // Advanced
  { id: 'set-text', label: 'Set font', description: '#set text(…)', icon: 'Aa', category: 'advanced', snippet: '#set text(font: "${1:New Computer Modern}", size: ${2:11}pt)\n$0', keywords: ['font', 'text', 'set', 'size'] },
  { id: 'set-page', label: 'Set page', description: '#set page(…)', icon: '□', category: 'advanced', snippet: '#set page(margin: ${1:1.5cm}, paper: "${2:a4}")\n$0', keywords: ['page', 'margin', 'paper', 'set'] },
  { id: 'bibliography', label: 'Bibliography', description: 'Reference list', icon: '≡', category: 'advanced', snippet: '#bibliography("${1:refs.bib}")\n$0', keywords: ['bibliography', 'references', 'bib'] },
]

export const CATEGORY_LABELS: Record<SlashCommand['category'], string> = {
  headings: 'Headings',
  text: 'Text',
  structure: 'Structure',
  media: 'Media & Code',
  advanced: 'Advanced',
}

export function filterCommands(query: string): SlashCommand[] {
  if (!query) return SLASH_COMMANDS
  const q = query.toLowerCase()
  return SLASH_COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(q) ||
    cmd.keywords.some(k => k.includes(q))
  )
}
