import { useState, useEffect, useRef, useCallback } from 'react'

interface CompileState {
  pdfBytes: Uint8Array | null
  error: string | null
  isCompiling: boolean
}

export function useTypstCompiler(content: string, filePath: string | null) {
  const [state, setState] = useState<CompileState>({
    pdfBytes: null,
    error: null,
    isCompiling: false
  })
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestContent = useRef(content)
  const latestFilePath = useRef(filePath)

  latestContent.current = content
  latestFilePath.current = filePath

  const compile = useCallback(async (src: string, path: string | null) => {
    setState(s => ({ ...s, isCompiling: true, error: null }))
    const result = await window.api.typstCompile(src, path)
    if ('pdfBytes' in result) {
      setState({ pdfBytes: new Uint8Array(result.pdfBytes), error: null, isCompiling: false })
    } else {
      setState(s => ({ ...s, error: result.error, isCompiling: false }))
    }
  }, [])

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      compile(latestContent.current, latestFilePath.current)
    }, 400)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [content, filePath, compile])

  return state
}
