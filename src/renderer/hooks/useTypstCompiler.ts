import { useState, useEffect, useRef, useCallback } from 'react'

interface CompileState {
  pdfBytes: Uint8Array | null
  error: string | null
  isCompiling: boolean
}

export function useTypstCompiler(
  content: string,
  filePath: string | null,
  compileFilePath?: string | null,
  onBeforeCompile?: () => Promise<void>
) {
  const [state, setState] = useState<CompileState>({
    pdfBytes: null,
    error: null,
    isCompiling: false
  })
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestContent = useRef(content)
  const latestFilePath = useRef(filePath)
  const latestCompileFilePath = useRef(compileFilePath)
  const latestOnBeforeCompile = useRef(onBeforeCompile)

  latestContent.current = content
  latestFilePath.current = filePath
  latestCompileFilePath.current = compileFilePath
  latestOnBeforeCompile.current = onBeforeCompile

  const compile = useCallback(async () => {
    setState(s => ({ ...s, isCompiling: true, error: null }))

    const bookFile = latestCompileFilePath.current
    if (bookFile) {
      if (latestOnBeforeCompile.current) await latestOnBeforeCompile.current()
      const result = await window.api.typstCompileFile(bookFile)
      if ('pdfBytes' in result) {
        setState({ pdfBytes: new Uint8Array(result.pdfBytes), error: null, isCompiling: false })
      } else {
        setState(s => ({ ...s, error: result.error, isCompiling: false }))
      }
    } else {
      const result = await window.api.typstCompile(latestContent.current, latestFilePath.current)
      if ('pdfBytes' in result) {
        setState({ pdfBytes: new Uint8Array(result.pdfBytes), error: null, isCompiling: false })
      } else {
        setState(s => ({ ...s, error: result.error, isCompiling: false }))
      }
    }
  }, [])

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(compile, 400)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [content, filePath, compileFilePath, compile])

  return { ...state, compile }
}
