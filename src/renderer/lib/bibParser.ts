export interface BibEntry {
  key: string
  type: string
  author?: string
  title?: string
  year?: string
}

function extractField(entryContent: string, field: string): string | undefined {
  const regex = new RegExp(`\\b${field}\\s*=\\s*`, 'i')
  const m = regex.exec(entryContent)
  if (!m) return undefined
  const start = m.index + m[0].length
  const ch = entryContent[start]
  if (ch === '{') {
    let depth = 1, i = start + 1
    while (i < entryContent.length && depth > 0) {
      if (entryContent[i] === '{') depth++
      else if (entryContent[i] === '}') depth--
      i++
    }
    return entryContent.slice(start + 1, i - 1).replace(/\s+/g, ' ').trim()
  } else if (ch === '"') {
    const end = entryContent.indexOf('"', start + 1)
    return end > -1 ? entryContent.slice(start + 1, end).trim() : undefined
  } else {
    // unquoted value e.g. year = 2023
    const end = entryContent.search(/[,}\n]/, start)
    return end > -1 ? entryContent.slice(start, end).trim() : undefined
  }
}

function firstAuthorLastName(author?: string): string | undefined {
  if (!author) return undefined
  const first = author.split(' and ')[0].trim()
  if (first.includes(',')) return first.split(',')[0].trim()
  const parts = first.split(/\s+/)
  return parts[parts.length - 1]
}

export function parseBib(content: string): BibEntry[] {
  const entries: BibEntry[] = []
  const entryRegex = /@(\w+)\s*\{\s*([^,\s]+)\s*,/g
  let match
  while ((match = entryRegex.exec(content)) !== null) {
    const type = match[1].toLowerCase()
    if (type === 'string' || type === 'preamble' || type === 'comment') continue
    const key = match[2].trim()
    const afterKey = content.slice(match.index + match[0].length)
    const rawAuthor = extractField(afterKey, 'author')
    const title = extractField(afterKey, 'title')
    const year = extractField(afterKey, 'year')
    const author = firstAuthorLastName(rawAuthor)
    entries.push({ key, type, author, title, year })
  }
  return entries
}
