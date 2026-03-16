import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Toolbar } from './components/Toolbar'
import { EditorPane } from './components/EditorPane'
import { PreviewPane } from './components/PreviewPane'
import { SettingsPanel } from './components/SettingsPanel'
import { useFileState } from './hooks/useFileState'
import { useTypstCompiler } from './hooks/useTypstCompiler'
import { useTokenColors } from './hooks/useTokenColors'

export default function App() {
  const { filePath, content, isDirty, lastSaved, setContent, openFile, saveFile, saveFileAs, newFile } =
    useFileState()
  const { pdfBytes, error, isCompiling } = useTypstCompiler(content, filePath)
  const { colors, updateColor, resetColors, resetOne } = useTokenColors()

  const [settingsOpen, setSettingsOpen] = useState(false)

  const exportPdf = useCallback(async () => {
    if (!pdfBytes) return
    await window.api.fileExportPdf(Array.from(pdfBytes), filePath)
  }, [pdfBytes, filePath])
  const [splitPct, setSplitPct] = useState(50)
  const dragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setSplitPct(Math.min(80, Math.max(20, pct)))
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  useEffect(() => {
    const unsubs = [
      window.api.onMenuNew(newFile),
      window.api.onMenuOpen(openFile),
      window.api.onMenuSave(() => saveFile(content)),
      window.api.onMenuSaveAs(() => saveFileAs(content))
    ]
    return () => unsubs.forEach(fn => fn())
  }, [content, newFile, openFile, saveFile, saveFileAs])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Toolbar
        filePath={filePath}
        isDirty={isDirty}
        isCompiling={isCompiling}
        hasError={!!error}
        onNew={newFile}
        onOpen={openFile}
        onSave={() => saveFile(content)}
        onSaveAs={() => saveFileAs(content)}
        onExportPdf={exportPdf}
        hasPdf={!!pdfBytes}
        lastSaved={lastSaved}
        onSettings={() => setSettingsOpen(v => !v)}
      />

      <div
        ref={containerRef}
        style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', padding: '10px', gap: 0 }}
      >
        {/* Editor glass panel */}
        <div style={{
          width: `calc(${splitPct}% - 5px)`,
          display: 'flex',
          overflow: 'hidden',
          borderRadius: 'var(--radius)',
          background: 'rgba(255,255,255,0.52)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--glass-shadow), inset 0 1px 0 rgba(255,255,255,0.95)'
        }}>
          <EditorPane value={content} onChange={setContent} tokenColors={colors} />
        </div>

        {/* Divider */}
        <div
          onMouseDown={onMouseDown}
          style={{
            width: 10,
            flexShrink: 0,
            cursor: 'col-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{
            width: 2,
            height: 48,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.7)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
          }} />
        </div>

        {/* Preview glass panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: 'var(--radius)',
          background: 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--glass-shadow), inset 0 1px 0 rgba(255,255,255,0.95)'
        }}>
          <PreviewPane pdfBytes={pdfBytes} error={error} isCompiling={isCompiling} />
        </div>
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        colors={colors}
        onColorChange={updateColor}
        onResetOne={resetOne}
        onResetAll={resetColors}
      />
    </div>
  )
}
