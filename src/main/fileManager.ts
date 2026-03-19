import { dialog, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs'
import { basename, dirname, join } from 'path'
import { spawn, execSync } from 'child_process'

export interface BookChapter {
  title: string
  file: string
  section?: 'front' | 'chapter' | 'back'
}

export interface BookConfig {
  title: string
  mainFile: string
  chapters: BookChapter[]
  bibliography?: string
}

export async function openFileByPath(filePath: string): Promise<{ path: string; content: string } | null> {
  try {
    const content = readFileSync(filePath, 'utf8')
    return { path: filePath, content }
  } catch {
    return null
  }
}

export async function openFile(): Promise<{ path: string; content: string } | null> {
  const win = BrowserWindow.getFocusedWindow()
  const result = await dialog.showOpenDialog(win!, {
    filters: [
      { name: 'Typst Files', extensions: ['typ'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  })

  if (result.canceled || result.filePaths.length === 0) return null

  const filePath = result.filePaths[0]
  const content = readFileSync(filePath, 'utf8')
  return { path: filePath, content }
}

export async function saveFile(
  filePath: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, content, 'utf8')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function saveFileAs(
  content: string
): Promise<{ path: string } | null> {
  const win = BrowserWindow.getFocusedWindow()
  const result = await dialog.showSaveDialog(win!, {
    filters: [
      { name: 'Typst Files', extensions: ['typ'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: 'document.typ'
  })

  if (result.canceled || !result.filePath) return null

  writeFileSync(result.filePath, content, 'utf8')
  return { path: result.filePath }
}

export async function exportPdf(
  pdfBytes: number[],
  sourceFilePath: string | null
): Promise<{ success: boolean; error?: string }> {
  const win = BrowserWindow.getFocusedWindow()
  const defaultName = sourceFilePath
    ? basename(sourceFilePath, '.typ') + '.pdf'
    : 'document.pdf'

  const result = await dialog.showSaveDialog(win!, {
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
    defaultPath: defaultName
  })

  if (result.canceled || !result.filePath) return { success: false }

  try {
    writeFileSync(result.filePath, Buffer.from(pdfBytes))
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function openFolder(): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow()
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
}

export function readBookConfig(dir: string): BookConfig | null {
  try {
    const configPath = join(dir, 'glyph-book.json')
    if (!existsSync(configPath)) return null
    return JSON.parse(readFileSync(configPath, 'utf8')) as BookConfig
  } catch {
    return null
  }
}

export function writeBookConfig(dir: string, config: BookConfig): { success: boolean; error?: string } {
  try {
    writeFileSync(join(dir, 'glyph-book.json'), JSON.stringify(config, null, 2), 'utf8')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export function listBibPaths(bookRoot: string): string[] {
  const results: string[] = []
  function walk(current: string) {
    try {
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const full = join(current, entry.name)
        if (entry.isDirectory()) {
          walk(full)
        } else if (entry.name.toLowerCase().endsWith('.bib')) {
          // Return as absolute-from-root path e.g. /back/references.bib
          results.push('/' + full.slice(bookRoot.length + 1).replace(/\\/g, '/'))
        }
      }
    } catch {}
  }
  walk(bookRoot)
  return results
}

export function createBook(dir: string, config: BookConfig): { success: boolean; error?: string } {
  try {
    for (const subdir of ['front', 'chapters', 'back', 'assets']) {
      const d = join(dir, subdir)
      if (!existsSync(d)) mkdirSync(d, { recursive: true })
    }

    // Create an empty typst.toml so Typst uses this folder as the project root
    const tomlPath = join(dir, 'typst.toml')
    if (!existsSync(tomlPath)) {
      writeFileSync(tomlPath, '', 'utf8')
    }

    for (const chapter of config.chapters) {
      const chapterPath = join(dir, chapter.file)
      if (!existsSync(chapterPath)) {
        writeFileSync(chapterPath, `= ${chapter.title}\n\nStart writing here.\n`, 'utf8')
      }
    }

    const mainPath = join(dir, config.mainFile)
    if (!existsSync(mainPath)) {
      const includes = config.chapters.map(c => `#include "${c.file}"`).join('\n')
      const bibLine = config.bibliography ? `\n#bibliography("${config.bibliography}")\n` : ''
      writeFileSync(mainPath,
        `#set page(margin: 2cm)\n#set text(font: "New Computer Modern", size: 11pt)\n\n${includes}${bibLine}`,
        'utf8'
      )
    }

    writeBookConfig(dir, config)
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.pdf']

export function listAssets(bookRoot: string): string[] {
  const assetsDir = join(bookRoot, 'assets')
  if (!existsSync(assetsDir)) return []

  function walk(dir: string): string[] {
    const results: string[] = []
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) {
          results.push(...walk(full))
        } else if (IMAGE_EXTS.some(ext => entry.name.toLowerCase().endsWith(ext))) {
          // Return as absolute-from-root path e.g. /assets/figure1.png
          results.push('/' + full.slice(bookRoot.length + 1).replace(/\\/g, '/'))
        }
      }
    } catch {}
    return results
  }

  return walk(assetsDir)
}

export function readBibFilesFromDir(dir: string): string[] {
  const results: string[] = []
  function walk(current: string) {
    try {
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const full = join(current, entry.name)
        if (entry.isDirectory()) {
          walk(full)
        } else if (entry.name.toLowerCase().endsWith('.bib')) {
          try { results.push(readFileSync(full, 'utf8')) } catch {}
        }
      }
    } catch {}
  }
  walk(dir)
  return results.filter(Boolean)
}

/** Read all .bib files in the same directory as the given source file. */
export function readBibFiles(sourceFilePath: string): string[] {
  try {
    const dir = dirname(sourceFilePath)
    const bibs = readdirSync(dir).filter(f => f.toLowerCase().endsWith('.bib'))
    return bibs.map(f => {
      try { return readFileSync(join(dir, f), 'utf8') } catch { return '' }
    }).filter(Boolean)
  } catch {
    return []
  }
}

function findPandoc(): string | null {
  try {
    const cmd = process.platform === 'win32' ? 'where pandoc' : 'which pandoc'
    const found = execSync(cmd, { encoding: 'utf8' }).trim().split('\n')[0]
    if (found) return found
  } catch {}
  const candidates = process.platform === 'win32'
    ? [`${process.env.LOCALAPPDATA}\\Pandoc\\pandoc.exe`]
    : ['/opt/homebrew/bin/pandoc', '/usr/local/bin/pandoc', '/usr/bin/pandoc']
  return candidates.find(c => { try { readFileSync(c); return true } catch { return false } }) ?? null
}

export async function exportDocx(
  sourceFilePath: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!sourceFilePath) {
    return { success: false, error: 'Save the file before exporting to Word.' }
  }

  const pandoc = findPandoc()
  if (!pandoc) {
    return { success: false, error: 'Pandoc is not installed. Install it from pandoc.org to enable Word export.' }
  }

  const win = BrowserWindow.getFocusedWindow()
  const defaultName = basename(sourceFilePath, '.typ') + '.docx'
  const result = await dialog.showSaveDialog(win!, {
    filters: [{ name: 'Word Document', extensions: ['docx'] }],
    defaultPath: defaultName
  })

  if (result.canceled || !result.filePath) return { success: false }

  return new Promise((resolve) => {
    const child = spawn(pandoc, [sourceFilePath, '-o', result.filePath!])
    let stderr = ''
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })
    child.on('close', (code) => {
      if (code === 0) resolve({ success: true })
      else resolve({ success: false, error: stderr.trim() || `pandoc exited with code ${code}` })
    })
    child.on('error', (err) => resolve({ success: false, error: err.message }))
  })
}
