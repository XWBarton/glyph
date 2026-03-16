import { dialog, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import { basename } from 'path'

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
