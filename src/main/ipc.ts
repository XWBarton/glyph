import { ipcMain } from 'electron'
import { compileTypst } from './compiler'
import { openFile, openFileByPath, saveFile, saveFileAs, exportPdf, exportDocx, readBibFiles } from './fileManager'

export function registerIpcHandlers(): void {
  ipcMain.handle('typst:compile', async (_event, content: string, filePath: string | null) => {
    const result = await compileTypst(content, filePath)
    if ('pdfBytes' in result) {
      return { pdfBytes: Array.from(result.pdfBytes) }
    }
    return result
  })

  ipcMain.handle('file:open', async () => {
    return openFile()
  })

  ipcMain.handle('file:open-by-path', async (_event, filePath: string) => {
    return openFileByPath(filePath)
  })

  ipcMain.handle('file:save', async (_event, filePath: string, content: string) => {
    return saveFile(filePath, content)
  })

  ipcMain.handle('file:save-as', async (_event, content: string) => {
    return saveFileAs(content)
  })

  ipcMain.handle('file:export-pdf', async (_event, pdfBytes: number[], sourceFilePath: string | null) => {
    return exportPdf(pdfBytes, sourceFilePath)
  })

  ipcMain.handle('file:export-docx', async (_event, sourceFilePath: string | null) => {
    return exportDocx(sourceFilePath)
  })

  ipcMain.handle('file:read-bibs', async (_event, sourceFilePath: string) => {
    return readBibFiles(sourceFilePath)
  })
}
