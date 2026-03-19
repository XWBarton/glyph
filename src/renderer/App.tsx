import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Toolbar } from './components/Toolbar'
import { EditorPane } from './components/EditorPane'
import { PreviewPane } from './components/PreviewPane'
import { SettingsPanel } from './components/SettingsPanel'
import { BookPanel } from './components/BookPanel'
import { useFileState } from './hooks/useFileState'
import { useTypstCompiler } from './hooks/useTypstCompiler'
import { useTokenColors } from './hooks/useTokenColors'

export default function App() {
  const {
    filePath, content, isDirty, lastSaved,
    bookRoot, bookConfig,
    setContent, openFile, saveFile, saveFileAs, newFile,
    activateFile, newBook, openBook, closeBook, updateBookConfig, addChapter, saveActiveNow,
  } = useFileState()

  const bookMainFilePath = bookRoot && bookConfig
    ? `${bookRoot}/${bookConfig.mainFile}`
    : null

  const [bookPreviewMode, setBookPreviewMode] = useState<'chapter' | 'book'>('chapter')
  const [bookBibPaths, setBookBibPaths] = useState<string[]>([])

  // Reset to chapter preview when book is closed
  useEffect(() => {
    if (!bookRoot) { setBookPreviewMode('chapter'); setBookBibPaths([]) ; return }
    window.api.bookListBibPaths(bookRoot).then(setBookBibPaths)
  }, [bookRoot])

  const chapterHasBib = bookRoot && content.includes('#bibliography(')
  const compileFilePath = bookMainFilePath && (bookPreviewMode === 'book' || chapterHasBib) ? bookMainFilePath : null

  // In chapter mode within a book, append bibliography so @cite keys resolve
  const compileContent = useMemo(() => {
    if (!bookRoot || compileFilePath || bookBibPaths.length === 0 || content.includes('#bibliography(')) return content
    const bibArg = bookBibPaths.length === 1
      ? `"${bookBibPaths[0]}"`
      : `(${bookBibPaths.map(p => `"${p}"`).join(', ')})`
    return content + `\n\n#bibliography(${bibArg}, title: none)`
  }, [content, bookRoot, compileFilePath, bookBibPaths])

  const { pdfBytes, error, isCompiling } = useTypstCompiler(
    compileContent,
    filePath,
    compileFilePath,
    compileFilePath ? saveActiveNow : undefined
  )

  const { colors, updateColor, resetColors, resetOne } = useTokenColors()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const exportPdf = useCallback(async () => {
    if (!pdfBytes) return
    await window.api.fileExportPdf(Array.from(pdfBytes), filePath)
  }, [pdfBytes, filePath])

  const exportDocx = useCallback(async () => {
    const go = confirm("I hate Word, but sometimes you gotta do what you gotta do.\n\nThe styling won't carry over very well. This is plain content only.")
    if (!go) return
    const result = await window.api.fileExportDocx(filePath)
    if (!result.success && result.error) alert(result.error)
  }, [filePath])

  const [splitPct, setSplitPct] = useState(50)
  const dragging = useRef(false)
  const splitContainerRef = useRef<HTMLDivElement>(null)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !splitContainerRef.current) return
      const rect = splitContainerRef.current.getBoundingClientRect()
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
        onExportDocx={exportDocx}
        hasPdf={!!pdfBytes}
        lastSaved={lastSaved}
        onSettings={() => setSettingsOpen(v => !v)}
        onNewBook={newBook}
        onOpenBook={openBook}
        isBookOpen={!!bookRoot}
      />

      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        padding: '10px',
        gap: 0,
      }}>
        {/* Book panel (when a book is open) */}
        {bookRoot && bookConfig && (
          <BookPanel
            bookRoot={bookRoot}
            bookConfig={bookConfig}
            activeFilePath={filePath}
            previewMode={bookPreviewMode}
            onActivate={(path) => { activateFile(path); setBookPreviewMode('chapter') }}
            onSelectFullBook={() => setBookPreviewMode('book')}
            onUpdateConfig={updateBookConfig}
            onClose={closeBook}
            onAddChapter={addChapter}
          />
        )}

        {/* Editor + Preview split container */}
        <div
          ref={splitContainerRef}
          style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 0 }}
        >
          {/* Editor glass panel.
              No backdrop-filter here: backdrop-filter creates a stacking context
              that traps Monaco's overlay widgets (suggest detail panel) behind the
              preview panel. Background + border preserve the glass look without it. */}
          <div style={{
            width: `calc(${splitPct}% - 5px)`,
            display: 'flex',
            overflow: 'visible',
            borderRadius: 'var(--radius)',
            background: 'rgba(255,255,255,0.72)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow), inset 0 1px 0 rgba(255,255,255,0.95)'
          }}>
            <EditorPane
              value={content}
              filePath={filePath}
              bookRoot={bookRoot}
              onChange={setContent}
              tokenColors={colors}
            />
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
            <PreviewPane
              pdfBytes={pdfBytes}
              error={error}
              isCompiling={isCompiling}
            />
          </div>
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
