import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { editor } from 'monaco-editor'

// Inject decoration styles once at module load
if (!document.getElementById('glyph-find-styles')) {
  const style = document.createElement('style')
  style.id = 'glyph-find-styles'
  style.textContent = `
    .glyph-find-match {
      background: rgba(37,99,235,0.16);
      border-radius: 2px;
    }
    .glyph-find-current {
      background: rgba(37,99,235,0.38);
      border-radius: 2px;
      outline: 1.5px solid rgba(37,99,235,0.6);
      outline-offset: -1px;
    }
  `
  document.head.appendChild(style)
}

const WORD_SEPARATORS = '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?'

interface Props {
  editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>
  open: boolean
  showReplace: boolean
  query: string
  onQueryChange: (q: string) => void
  onShowReplaceChange: (v: boolean) => void
  onClose: () => void
}

export function FindReplaceModal({
  editorRef, open, showReplace, query, onQueryChange, onShowReplaceChange, onClose
}: Props) {
  const [replacement, setReplacement] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [matches, setMatches] = useState<editor.FindMatch[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [invalidRegex, setInvalidRegex] = useState(false)
  const [contentVersion, setContentVersion] = useState(0)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null)

  // Focus search input and select all when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const el = searchInputRef.current
        if (el) { el.focus(); el.select() }
      }, 30)
    } else {
      decorationsRef.current?.clear()
    }
  }, [open])

  // Listen for model content changes (e.g. after replace) to re-run search
  useEffect(() => {
    if (!open) return
    const ed = editorRef.current
    if (!ed) return
    const model = ed.getModel()
    if (!model) return
    const disposable = model.onDidChangeContent(() => setContentVersion(v => v + 1))
    return () => disposable.dispose()
  }, [open, editorRef])

  // Run findMatches whenever query/options/content change
  useEffect(() => {
    const ed = editorRef.current
    if (!ed || !open) { setMatches([]); return }
    const model = ed.getModel()
    if (!model || !query) {
      setMatches([])
      decorationsRef.current?.set([])
      return
    }
    if (useRegex) {
      try { new RegExp(query) } catch {
        setInvalidRegex(true)
        setMatches([])
        decorationsRef.current?.set([])
        return
      }
    }
    setInvalidRegex(false)
    const found = model.findMatches(query, false, useRegex, matchCase, wholeWord ? WORD_SEPARATORS : null, false)
    setMatches(found)
    setCurrentIdx(prev => Math.min(prev, Math.max(0, found.length - 1)))
  }, [query, matchCase, wholeWord, useRegex, open, contentVersion, editorRef])

  // Apply decorations and reveal current match
  useEffect(() => {
    const ed = editorRef.current
    if (!ed) return
    if (!decorationsRef.current) decorationsRef.current = ed.createDecorationsCollection([])

    if (matches.length === 0) {
      decorationsRef.current.set([])
      return
    }
    decorationsRef.current.set(matches.map((m, i) => ({
      range: m.range,
      options: { inlineClassName: i === currentIdx ? 'glyph-find-current' : 'glyph-find-match' }
    })))
    if (matches[currentIdx]) {
      ed.revealRangeInCenterIfOutsideViewport(matches[currentIdx].range)
      ed.setSelection(matches[currentIdx].range)
    }
  }, [matches, currentIdx, editorRef])

  const goNext = useCallback(() => {
    if (matches.length === 0) return
    setCurrentIdx(i => (i + 1) % matches.length)
  }, [matches.length])

  const goPrev = useCallback(() => {
    if (matches.length === 0) return
    setCurrentIdx(i => (i - 1 + matches.length) % matches.length)
  }, [matches.length])

  const replaceOne = useCallback(() => {
    const ed = editorRef.current
    if (!ed || !matches[currentIdx]) return
    ed.executeEdits('glyph-find-replace', [{ range: matches[currentIdx].range, text: replacement }])
    ed.focus()
  }, [editorRef, matches, currentIdx, replacement])

  const replaceAll = useCallback(() => {
    const ed = editorRef.current
    if (!ed || matches.length === 0) return
    ed.executeEdits('glyph-find-replace', [...matches].reverse().map(m => ({ range: m.range, text: replacement })))
    ed.focus()
  }, [editorRef, matches, replacement])

  const handleClose = useCallback(() => {
    onClose()
    editorRef.current?.focus()
  }, [onClose, editorRef])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); handleClose() }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); goNext() }
    if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); goPrev() }
  }

  if (!open) return null

  const noMatches = !!query && !invalidRegex && matches.length === 0
  const matchInfo = invalidRegex
    ? 'Invalid regex'
    : query
      ? matches.length === 0 ? 'No results' : `${currentIdx + 1} / ${matches.length}`
      : ''

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        position: 'absolute',
        top: 12,
        right: 18,
        zIndex: 20,
        width: 330,
        background: 'rgba(250,251,255,0.94)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.85)',
        borderRadius: 'var(--radius)',
        boxShadow: '0 8px 32px rgba(0,40,120,0.11), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
      }}
    >
      {/* Search row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {/* Toggle replace */}
        <button
          onClick={() => onShowReplaceChange(!showReplace)}
          title={showReplace ? 'Hide replace' : 'Show replace'}
          style={iconBtnStyle(showReplace)}
        >
          <span style={{ fontSize: 9, lineHeight: 1 }}>{showReplace ? '▾' : '▸'}</span>
        </button>

        {/* Search input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={searchInputRef}
            value={query}
            onChange={e => { onQueryChange(e.target.value); setCurrentIdx(0) }}
            placeholder="Find"
            spellCheck={false}
            style={inputStyle(noMatches || invalidRegex)}
          />
          {matchInfo && (
            <span style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 10,
              color: (noMatches || invalidRegex) ? 'var(--red)' : 'var(--overlay)',
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              {matchInfo}
            </span>
          )}
        </div>

        {/* Prev / Next */}
        <button onClick={goPrev} disabled={matches.length === 0} title="Previous match (Shift+Enter)" style={iconBtnStyle(false, matches.length === 0)}>↑</button>
        <button onClick={goNext} disabled={matches.length === 0} title="Next match (Enter)" style={iconBtnStyle(false, matches.length === 0)}>↓</button>

        {/* Close */}
        <button onClick={handleClose} title="Close (Esc)" style={iconBtnStyle(false)}>
          <span style={{ fontSize: 10 }}>✕</span>
        </button>
      </div>

      {/* Replace row */}
      {showReplace && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 26, flexShrink: 0 }} />
          <input
            value={replacement}
            onChange={e => setReplacement(e.target.value)}
            placeholder="Replace"
            spellCheck={false}
            style={{ ...inputStyle(false), paddingRight: 8 }}
          />
          <button
            onClick={replaceOne}
            disabled={matches.length === 0}
            title="Replace"
            style={replaceBtnStyle(matches.length === 0)}
          >1</button>
          <button
            onClick={replaceAll}
            disabled={matches.length === 0}
            title="Replace all"
            style={replaceBtnStyle(matches.length === 0)}
          >All</button>
        </div>
      )}

      {/* Options row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 31 }}>
        <ToggleBtn active={matchCase} onClick={() => { setMatchCase(v => !v); setCurrentIdx(0) }} title="Match case">Aa</ToggleBtn>
        <ToggleBtn active={wholeWord} onClick={() => { setWholeWord(v => !v); setCurrentIdx(0) }} title="Whole word">W</ToggleBtn>
        <ToggleBtn active={useRegex} onClick={() => { setUseRegex(v => !v); setCurrentIdx(0) }} title="Regular expression">.*</ToggleBtn>
      </div>
    </div>
  )
}

// ── Small components ──────────────────────────────────────────────────────────

function ToggleBtn({ active, onClick, title, children }: {
  active: boolean; onClick: () => void; title: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? 'rgba(37,99,235,0.12)' : 'transparent',
        border: `1px solid ${active ? 'rgba(37,99,235,0.3)' : 'rgba(0,0,0,0.08)'}`,
        borderRadius: 5,
        padding: '2px 6px',
        fontSize: 10,
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--accent)' : 'var(--subtext)',
        cursor: 'pointer',
        letterSpacing: '-0.01em',
        lineHeight: '16px',
        transition: 'all 0.12s',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}

function inputStyle(error: boolean): React.CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.75)',
    border: `1px solid ${error ? 'rgba(220,38,38,0.45)' : 'rgba(0,0,0,0.10)'}`,
    borderRadius: 7,
    padding: '5px 40px 5px 9px',
    fontSize: 12,
    color: 'var(--text)',
    outline: 'none',
    letterSpacing: '-0.01em',
    fontFamily: 'inherit',
    transition: 'border-color 0.12s',
  }
}

function iconBtnStyle(active: boolean, disabled = false): React.CSSProperties {
  return {
    background: active ? 'rgba(37,99,235,0.10)' : 'transparent',
    border: `1px solid ${active ? 'rgba(37,99,235,0.25)' : 'transparent'}`,
    borderRadius: 6,
    width: 26,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.3 : active ? 1 : 0.55,
    color: active ? 'var(--accent)' : 'var(--text)',
    fontSize: 13,
    flexShrink: 0,
    padding: 0,
    transition: 'background 0.12s',
  }
}

function replaceBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? 'transparent' : 'rgba(37,99,235,0.08)',
    border: `1px solid ${disabled ? 'rgba(0,0,0,0.06)' : 'rgba(37,99,235,0.2)'}`,
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: 11,
    color: disabled ? 'var(--overlay)' : 'var(--accent)',
    cursor: disabled ? 'default' : 'pointer',
    flexShrink: 0,
    fontFamily: 'inherit',
    letterSpacing: '-0.01em',
    transition: 'all 0.12s',
  }
}
