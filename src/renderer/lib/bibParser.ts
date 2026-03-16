export interface BibEntry {
  key: string
  type: string
  author?: string   // full BibTeX author string
  title?: string
  year?: string
  journal?: string
  booktitle?: string
  volume?: string
  number?: string
  pages?: string
  doi?: string
  publisher?: string
}

/** Strip BibTeX curly braces and basic LaTeX commands from a field value. */
function stripBraces(s: string): string {
  return s
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
    .replace(/\{([^}]*)\}/g, '$1')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractField(entryContent: string, field: string): string | undefined {
  const regex = new RegExp(`\\b${field}\\s*=\\s*`, 'i')
  const m = regex.exec(entryContent)
  if (!m) return undefined
  const start = m.index + m[0].length
  const ch = entryContent[start]
  let raw: string | undefined
  if (ch === '{') {
    let depth = 1, i = start + 1
    while (i < entryContent.length && depth > 0) {
      if (entryContent[i] === '{') depth++
      else if (entryContent[i] === '}') depth--
      i++
    }
    raw = entryContent.slice(start + 1, i - 1)
  } else if (ch === '"') {
    const end = entryContent.indexOf('"', start + 1)
    raw = end > -1 ? entryContent.slice(start + 1, end) : undefined
  } else {
    const end = entryContent.search(/[,}\n]/, start)
    raw = end > -1 ? entryContent.slice(start, end) : undefined
  }
  return raw !== undefined ? stripBraces(raw) : undefined
}

/** First author's last name — used for the inline detail label. */
export function firstAuthorLastName(author?: string): string | undefined {
  if (!author) return undefined
  const first = author.split(/\s+and\s+/i)[0].trim()
  if (first.includes(',')) return first.split(',')[0].trim()
  const parts = first.split(/\s+/)
  return parts[parts.length - 1]
}

/** Format all authors as "Last, F., Last2, F2." */
function formatAuthors(author: string): string {
  return author
    .split(/\s+and\s+/i)
    .map(a => {
      a = a.trim()
      if (a.includes(',')) {
        const [last, rest = ''] = a.split(',').map(s => s.trim())
        const initial = rest.split(/\s+/)[0]?.[0]
        return initial ? `${last}, ${initial}.` : last
      }
      const parts = a.split(/\s+/)
      const last = parts.pop() ?? ''
      const initial = parts[0]?.[0]
      return initial ? `${last}, ${initial}.` : last
    })
    .join(', ')
}

/**
 * Format a full bibliography entry in simplified APA style.
 * Returns a markdown string for Monaco's documentation popup.
 */
export function formatBibEntry(e: BibEntry): string {
  const lines: string[] = []

  const authors = e.author ? formatAuthors(e.author) : ''
  const year = e.year ? `(${e.year})` : ''
  const header = [authors, year].filter(Boolean).join(' ')
  if (header) lines.push(`**${header}**`)
  if (e.title) lines.push(`*${e.title}*`)

  const type = e.type.toLowerCase()
  if (type === 'article') {
    const parts: string[] = []
    if (e.journal) parts.push(`*${e.journal}*`)
    if (e.volume && e.number) parts.push(`*${e.volume}*(${e.number})`)
    else if (e.volume) parts.push(`*${e.volume}*`)
    if (e.pages) parts.push(e.pages.replace(/--?/, '\u2013'))
    if (parts.length) lines.push(parts.join(', ') + '.')
  } else if (type === 'inproceedings' || type === 'conference') {
    if (e.booktitle) lines.push(`In *${e.booktitle}*.`)
  } else if (type === 'book' || type === 'incollection') {
    if (e.publisher) lines.push(`${e.publisher}.`)
    if (type === 'incollection' && e.booktitle) lines.push(`In *${e.booktitle}*.`)
  }

  if (e.doi) lines.push(`doi: ${e.doi}`)

  return lines.join('\n\n')
}

export function parseBib(content: string): BibEntry[] {
  const entries: BibEntry[] = []
  const entryRegex = /@(\w+)\s*\{\s*([^,\s]+)\s*,/g
  let match
  while ((match = entryRegex.exec(content)) !== null) {
    const type = match[1].toLowerCase()
    if (type === 'string' || type === 'preamble' || type === 'comment') continue
    const key = match[2].trim()
    const body = content.slice(match.index + match[0].length)
    entries.push({
      key, type,
      author:    extractField(body, 'author'),
      title:     extractField(body, 'title'),
      year:      extractField(body, 'year'),
      journal:   extractField(body, 'journal'),
      booktitle: extractField(body, 'booktitle'),
      volume:    extractField(body, 'volume'),
      number:    extractField(body, 'number') ?? extractField(body, 'issue'),
      pages:     extractField(body, 'pages'),
      doi:       extractField(body, 'doi'),
      publisher: extractField(body, 'publisher'),
    })
  }
  return entries
}
