import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

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

export interface TypstEditorAPI {
  typstCompile(content: string, filePath: string | null): Promise<{ pdfBytes: number[] } | { error: string }>
  typstCompileFile(filePath: string): Promise<{ pdfBytes: number[] } | { error: string }>
  fileOpen(): Promise<{ path: string; content: string } | null>
  fileOpenByPath(filePath: string): Promise<{ path: string; content: string } | null>
  fileSave(filePath: string, content: string): Promise<{ success: boolean; error?: string }>
  fileSaveAs(content: string): Promise<{ path: string } | null>
  fileExportPdf(pdfBytes: number[], sourceFilePath: string | null): Promise<{ success: boolean; error?: string }>
  fileExportDocx(sourceFilePath: string | null): Promise<{ success: boolean; error?: string }>
  fileReadBibs(sourceFilePath: string): Promise<string[]>
  fileReadBibsFromDir(dir: string): Promise<string[]>
  bookOpenFolder(): Promise<string | null>
  bookReadConfig(dir: string): Promise<BookConfig | null>
  bookWriteConfig(dir: string, config: BookConfig): Promise<{ success: boolean; error?: string }>
  bookCreate(dir: string, config: BookConfig): Promise<{ success: boolean; error?: string }>
  bookListAssets(bookRoot: string): Promise<string[]>
  bookListBibPaths(bookRoot: string): Promise<string[]>
  onMenuNew(cb: () => void): () => void
  onMenuOpen(cb: () => void): () => void
  onMenuSave(cb: () => void): () => void
  onMenuSaveAs(cb: () => void): () => void
  onOpenFile(cb: (filePath: string) => void): () => void
}

const api: TypstEditorAPI = {
  typstCompile: (content, filePath) =>
    ipcRenderer.invoke('typst:compile', content, filePath),

  typstCompileFile: (filePath) =>
    ipcRenderer.invoke('typst:compile-file', filePath),

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

  fileExportDocx: (sourceFilePath) =>
    ipcRenderer.invoke('file:export-docx', sourceFilePath),

  fileReadBibs: (sourceFilePath) =>
    ipcRenderer.invoke('file:read-bibs', sourceFilePath),

  fileReadBibsFromDir: (dir) =>
    ipcRenderer.invoke('file:read-bibs-from-dir', dir),

  bookOpenFolder: () =>
    ipcRenderer.invoke('book:open-folder'),

  bookReadConfig: (dir) =>
    ipcRenderer.invoke('book:read-config', dir),

  bookWriteConfig: (dir, config) =>
    ipcRenderer.invoke('book:write-config', dir, config),

  bookCreate: (dir, config) =>
    ipcRenderer.invoke('book:create', dir, config),

  bookListAssets: (bookRoot) =>
    ipcRenderer.invoke('book:list-assets', bookRoot),

  bookListBibPaths: (bookRoot) =>
    ipcRenderer.invoke('book:list-bib-paths', bookRoot),

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
