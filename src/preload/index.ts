import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

export interface TypstEditorAPI {
  typstCompile(content: string, filePath: string | null): Promise<{ pdfBytes: number[] } | { error: string }>
  fileOpen(): Promise<{ path: string; content: string } | null>
  fileOpenByPath(filePath: string): Promise<{ path: string; content: string } | null>
  fileSave(filePath: string, content: string): Promise<{ success: boolean; error?: string }>
  fileSaveAs(content: string): Promise<{ path: string } | null>
  fileExportPdf(pdfBytes: number[], sourceFilePath: string | null): Promise<{ success: boolean; error?: string }>
  onMenuNew(cb: () => void): () => void
  onMenuOpen(cb: () => void): () => void
  onMenuSave(cb: () => void): () => void
  onMenuSaveAs(cb: () => void): () => void
  onOpenFile(cb: (filePath: string) => void): () => void
}

const api: TypstEditorAPI = {
  typstCompile: (content, filePath) =>
    ipcRenderer.invoke('typst:compile', content, filePath),

  fileOpen: () =>
    ipcRenderer.invoke('file:open'),

  fileOpenByPath: (filePath) =>
    ipcRenderer.invoke('file:open-by-path', filePath),

  fileSave: (filePath, content) =>
    ipcRenderer.invoke('file:save', filePath, content),

  fileSaveAs: (content) =>
    ipcRenderer.invoke('file:save-as', content),

  fileExportPdf: (pdfBytes, sourceFilePath) =>
    ipcRenderer.invoke('file:export-pdf', pdfBytes, sourceFilePath),

  onMenuNew: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('menu:new', handler)
    return () => ipcRenderer.off('menu:new', handler)
  },

  onMenuOpen: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('menu:open', handler)
    return () => ipcRenderer.off('menu:open', handler)
  },

  onMenuSave: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('menu:save', handler)
    return () => ipcRenderer.off('menu:save', handler)
  },

  onMenuSaveAs: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('menu:save-as', handler)
    return () => ipcRenderer.off('menu:save-as', handler)
  },

  onOpenFile: (cb) => {
    const handler = (_: IpcRendererEvent, filePath: string) => cb(filePath)
    ipcRenderer.on('file:open-path', handler)
    return () => ipcRenderer.off('file:open-path', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)
