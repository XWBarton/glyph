import { useState, useCallback, useEffect, useRef } from 'react'

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

interface OpenFile {
  content: string
  isDirty: boolean
  lastSaved: Date | null
}

interface State {
  openFiles: Record<string, OpenFile>
  activeFilePath: string | null
  bookRoot: string | null
  bookConfig: BookConfig | null
}

const DEFAULT_CONTENT = `#set page(margin: 1.5cm)
#set text(font: "New Computer Modern", size: 11pt)

= Hello, Typst!

This is a live preview editor. Start typing to see your document rendered in real time.

== Features

- *Live preview* as you type
- Full Typst language support
- Offline — no internet required

#align(center)[
  #rect(fill: blue.lighten(80%), inset: 12pt, radius: 4pt)[
    Edit this document and watch the preview update automatically.
  ]
]
`

const AUTO_SAVE_DELAY = 2000

function joinPath(base: string, rel: string): string {
  return base.replace(/\/$/, '') + '/' + rel.replace(/^\//, '')
}

export function useFileState() {
  const [state, setState] = useState<State>({
    openFiles: {},
    activeFilePath: null,
    bookRoot: null,
    bookConfig: null,
  })

  const stateRef = useRef(state)
  stateRef.current = state
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeFile = state.activeFilePath ? state.openFiles[state.activeFilePath] : null
  const filePath = state.activeFilePath
  const content = activeFile?.content ?? DEFAULT_CONTENT
  const isDirty = activeFile?.isDirty ?? false
  const lastSaved = activeFile?.lastSaved ?? null

  // Auto-save active file 2s after last change
  useEffect(() => {
    const path = state.activeFilePath
    if (!path || !activeFile?.isDirty) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const s = stateRef.current
      const f = s.activeFilePath ? s.openFiles[s.activeFilePath] : null
      if (!f?.isDirty || !s.activeFilePath) return
      await window.api.fileSave(s.activeFilePath, f.content)
      setState(prev => {
        const p = prev.activeFilePath
        if (!p) return prev
        return {
          ...prev,
          openFiles: { ...prev.openFiles, [p]: { ...prev.openFiles[p], isDirty: false, lastSaved: new Date() } }
        }
      })
    }, AUTO_SAVE_DELAY)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [activeFile?.content, activeFile?.isDirty, state.activeFilePath])

  const setContent = useCallback((newContent: string) => {
    setState(s => {
      const path = s.activeFilePath
      if (!path) return s
      return {
        ...s,
        openFiles: { ...s.openFiles, [path]: { ...s.openFiles[path], content: newContent, isDirty: true } }
      }
    })
  }, [])

  const openFileInState = useCallback((path: string, fileContent: string) => {
    setState(s => ({
      ...s,
      activeFilePath: path,
      openFiles: {
        ...s.openFiles,
        [path]: s.openFiles[path] ?? { content: fileContent, isDirty: false, lastSaved: null }
      }
    }))
  }, [])

  const openFile = useCallback(async () => {
    const result = await window.api.fileOpen()
    if (result) openFileInState(result.path, result.content)
  }, [openFileInState])

  useEffect(() => {
    return window.api.onOpenFile(async (filePath) => {
      const result = await window.api.fileOpenByPath(filePath)
      if (result) openFileInState(result.path, result.content)
    })
  }, [openFileInState])

  const activateFile = useCallback(async (absolutePath: string) => {
    const current = stateRef.current
    if (current.openFiles[absolutePath]) {
      setState(s => ({ ...s, activeFilePath: absolutePath }))
      return
    }
    const result = await window.api.fileOpenByPath(absolutePath)
    if (result) openFileInState(result.path, result.content)
  }, [openFileInState])

  const saveFile = useCallback(async (contentArg?: string) => {
    const s = stateRef.current
    const path = s.activeFilePath
    const fileContent = contentArg !== undefined ? contentArg : (path ? s.openFiles[path]?.content : undefined) ?? DEFAULT_CONTENT

    if (!path) {
      const result = await window.api.fileSaveAs(fileContent)
      if (result) {
        setState(prev => ({
          ...prev,
          activeFilePath: result.path,
          openFiles: { ...prev.openFiles, [result.path]: { content: fileContent, isDirty: false, lastSaved: new Date() } }
        }))
      }
    } else {
      await window.api.fileSave(path, fileContent)
      setState(prev => ({
        ...prev,
        openFiles: { ...prev.openFiles, [path]: { ...prev.openFiles[path], isDirty: false, lastSaved: new Date() } }
      }))
    }
  }, [])

  const saveFileAs = useCallback(async (contentArg?: string) => {
    const s = stateRef.current
    const path = s.activeFilePath
    const fileContent = contentArg !== undefined ? contentArg : (path ? s.openFiles[path]?.content : undefined) ?? DEFAULT_CONTENT
    const result = await window.api.fileSaveAs(fileContent)
    if (result) {
      setState(prev => ({
        ...prev,
        activeFilePath: result.path,
        openFiles: { ...prev.openFiles, [result.path]: { content: fileContent, isDirty: false, lastSaved: new Date() } }
      }))
    }
  }, [])

  const newFile = useCallback(() => {
    setState({ openFiles: {}, activeFilePath: null, bookRoot: null, bookConfig: null })
  }, [])

  // Save active file immediately (used before book compilation)
  const saveActiveNow = useCallback(async () => {
    const s = stateRef.current
    const path = s.activeFilePath
    if (!path) return
    const f = s.openFiles[path]
    if (!f?.isDirty) return
    await window.api.fileSave(path, f.content)
    setState(prev => {
      const p = prev.activeFilePath
      if (!p) return prev
      return {
        ...prev,
        openFiles: { ...prev.openFiles, [p]: { ...prev.openFiles[p], isDirty: false, lastSaved: new Date() } }
      }
    })
  }, [])

  const loadBookFromDir = useCallback(async (dir: string, config: BookConfig) => {
    const firstChapter = config.chapters[0]
    if (firstChapter) {
      const chapterPath = joinPath(dir, firstChapter.file)
      const result = await window.api.fileOpenByPath(chapterPath)
      setState({
        openFiles: result ? { [chapterPath]: { content: result.content, isDirty: false, lastSaved: null } } : {},
        activeFilePath: result ? chapterPath : null,
        bookRoot: dir,
        bookConfig: config,
      })
    } else {
      setState(s => ({ ...s, bookRoot: dir, bookConfig: config }))
    }
  }, [])

  const newBook = useCallback(async () => {
    const dir = await window.api.bookOpenFolder()
    if (!dir) return

    const folderName = dir.split('/').pop() || 'My Book'
    const config: BookConfig = {
      title: folderName,
      mainFile: 'main.typ',
      chapters: [
        { title: 'Title Page', file: 'front/title-page.typ', section: 'front' as const },
        { title: 'Chapter 1', file: 'chapters/ch01.typ', section: 'chapter' as const },
        { title: 'References', file: 'back/references.typ', section: 'back' as const },
      ]
    }
    const result = await window.api.bookCreate(dir, config)
    if (!result.success) {
      alert(result.error || 'Failed to create book structure.')
      return
    }
    await loadBookFromDir(dir, config)
  }, [loadBookFromDir])

  const openBook = useCallback(async () => {
    const dir = await window.api.bookOpenFolder()
    if (!dir) return

    const config = await window.api.bookReadConfig(dir)
    if (!config) {
      alert('No book found in this folder. Use "New Book" to create one.')
      return
    }

    // Ensure typst.toml exists so Typst uses the book folder as project root
    const tomlPath = joinPath(dir, 'typst.toml')
    const tomlExists = await window.api.fileOpenByPath(tomlPath)
    if (!tomlExists) await window.api.fileSave(tomlPath, '')

    await loadBookFromDir(dir, config)
  }, [loadBookFromDir])

  const closeBook = useCallback(() => {
    setState(s => ({ ...s, bookRoot: null, bookConfig: null }))
  }, [])

  const updateBookConfig = useCallback(async (config: BookConfig) => {
    const dir = stateRef.current.bookRoot
    if (!dir) return
    await window.api.bookWriteConfig(dir, config)

    // Rewrite main.typ with updated includes
    const includes = config.chapters.map(c => `#include "${c.file}"`).join('\n')
    const bibLine = config.bibliography ? `\n#bibliography("${config.bibliography}")\n` : ''
    const mainPath = joinPath(dir, config.mainFile)
    const mainResult = await window.api.fileOpenByPath(mainPath)
    if (mainResult) {
      const mainContent = `#set page(margin: 2cm)\n#set text(font: "New Computer Modern", size: 11pt)\n\n${includes}${bibLine}`
      await window.api.fileSave(mainPath, mainContent)
    }

    setState(s => ({ ...s, bookConfig: config }))
  }, [])

  const addChapter = useCallback(async (title: string, section: 'front' | 'chapter' | 'back' = 'chapter') => {
    const { bookRoot, bookConfig } = stateRef.current
    if (!bookRoot || !bookConfig) return

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const dir = section === 'front' ? 'front' : section === 'back' ? 'back' : 'chapters'
    const sectionItems = bookConfig.chapters.filter(c => (c.section ?? 'chapter') === section)
    const idx = String(sectionItems.length + 1).padStart(2, '0')
    const prefix = section === 'chapter' ? `ch${idx}-` : ''
    const file = `${dir}/${prefix}${slug}.typ`
    const chapterPath = joinPath(bookRoot, file)
    const chapterContent = `= ${title}\n\nStart writing here.\n`

    await window.api.fileSave(chapterPath, chapterContent)

    // Insert at the end of that section's block in the list
    const chapters = [...bookConfig.chapters]
    const lastInSection = chapters.map((c, i) => ({ c, i }))
      .filter(({ c }) => (c.section ?? 'chapter') === section)
      .pop()
    const insertAt = lastInSection ? lastInSection.i + 1 : chapters.length
    chapters.splice(insertAt, 0, { title, file, section })

    const newConfig = { ...bookConfig, chapters }
    await updateBookConfig(newConfig)

    openFileInState(chapterPath, chapterContent)
  }, [updateBookConfig, openFileInState])

  return {
    filePath,
    content,
    isDirty,
    lastSaved,
    bookRoot: state.bookRoot,
    bookConfig: state.bookConfig,
    setContent,
    openFile,
    saveFile,
    saveFileAs,
    newFile,
    activateFile,
    newBook,
    openBook,
    closeBook,
    updateBookConfig,
    addChapter,
    saveActiveNow,
  }
}
