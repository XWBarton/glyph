import { dialog, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { basename, dirname, join } from 'path'
import { spawn, execSync } from 'child_process'

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
