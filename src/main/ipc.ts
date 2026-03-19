import { ipcMain } from 'electron'
import { compileTypst, compileTypstFile } from './compiler'
import {
  openFile, openFileByPath, openFolder,
  saveFile, saveFileAs, exportPdf, exportDocx,
  readBibFiles, readBibFilesFromDir,
  readBookConfig, writeBookConfig, createBook, listAssets, listBibPaths,
  type BookConfig
} from './fileManager'

export function registerIpcHandlers(): void {
  ipcMain.handle('typst:compile', async (_event, content: string, filePath: string | null) => {
    const result = await compileTypst(content, filePath)
    if ('pdfBytes' in result) {
      return { pdfBytes: Array.from(result.pdfBytes) }
    }
    return result
  })

  ipcMain.handle('typst:compile-file', async (_event, filePath: string) => {
    const result = await compileTypstFile(filePath)
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

  ipcMain.handle('file:read-bibs-from-dir', async (_event, dir: string) => {
    return readBibFilesFromDir(dir)
  })

  ipcMain.handle('book:open-folder', async () => {
    return openFolder()
  })

  ipcMain.handle('book:read-config', async (_event, dir: string) => {
    return readBookConfig(dir)
  })

  ipcMain.handle('book:write-config', async (_event, dir: string, config: BookConfig) => {
    return writeBookConfig(dir, config)
  })

  ipcMain.handle('book:create', async (_event, dir: string, config: BookConfig) => {
    return createBook(dir, config)
  })

  ipcMain.handle('book:list-assets', async (_event, bookRoot: string) => {
    return listAssets(bookRoot)
  })

  ipcMain.handle('book:list-bib-paths', async (_event, bookRoot: string) => {
    return listBibPaths(bookRoot)
  })
}
