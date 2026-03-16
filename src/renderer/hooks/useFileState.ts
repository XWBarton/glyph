import { useState, useCallback, useEffect, useRef } from 'react'

interface FileState {
  filePath: string | null
  content: string
  isDirty: boolean
  lastSaved: Date | null
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

export function useFileState() {
  const [state, setState] = useState<FileState>({
    filePath: null,
    content: DEFAULT_CONTENT,
    isDirty: false,
    lastSaved: null
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Keep a ref to current state so the timer callback always sees latest values
  const stateRef = useRef(state)
  stateRef.current = state

  // Auto-save: fires 2s after the last content change, only if file is saved
  useEffect(() => {
    if (!state.isDirty || !state.filePath) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const { filePath, content, isDirty } = stateRef.current
      if (!isDirty || !filePath) return
      await window.api.fileSave(filePath, content)
      setState(s => ({ ...s, isDirty: false, lastSaved: new Date() }))
    }, AUTO_SAVE_DELAY)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [state.content, state.isDirty, state.filePath])

  const setContent = useCallback((content: string) => {
    setState(s => ({ ...s, content, isDirty: true }))
  }, [])

  const openFile = useCallback(async () => {
    const result = await window.api.fileOpen()
    if (result) {
      setState({ filePath: result.path, content: result.content, isDirty: false, lastSaved: null })
    }
  }, [])

  // Handle "Open With" / double-click from the OS
  useEffect(() => {
    return window.api.onOpenFile(async (filePath) => {
      const result = await window.api.fileOpenByPath(filePath)
      if (result) {
        setState({ filePath: result.path, content: result.content, isDirty: false, lastSaved: null })
      }
    })
  }, [])

  const saveFile = useCallback(async (content: string) => {
    const currentPath = stateRef.current.filePath
    if (!currentPath) {
      const result = await window.api.fileSaveAs(content)
      if (result) {
        setState(s => ({ ...s, filePath: result.path, isDirty: false }))
      }
    } else {
      await window.api.fileSave(currentPath, content)
      setState(s => ({ ...s, isDirty: false, lastSaved: new Date() }))
    }
  }, [])

  const saveFileAs = useCallback(async (content: string) => {
    const result = await window.api.fileSaveAs(content)
    if (result) {
      setState(s => ({ ...s, filePath: result.path, isDirty: false, lastSaved: new Date() }))
    }
  }, [])

  const newFile = useCallback(() => {
    setState({ filePath: null, content: DEFAULT_CONTENT, isDirty: false })
  }, [])

  return {
    ...state,
    setContent,
    openFile,
    saveFile,
    saveFileAs,
    newFile
  }
}
