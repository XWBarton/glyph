import React, { useEffect, useRef, useState, useCallback } from 'react'
import MonacoEditor, { loader, type OnMount } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import type { editor } from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import { registerTypstLanguage, TYPST_LANGUAGE_ID } from '../lib/typstLanguage'
import { buildMonacoTheme, type TokenColors } from '../lib/tokenColors'
import { filterCommands, type SlashCommand } from '../lib/slashCommands'
import { SlashCommandPalette } from './SlashCommandPalette'
import { FindReplaceModal } from './FindReplaceModal'
import { parseBib, formatBibEntry, firstAuthorLastName, type BibEntry } from '../lib/bibParser'

self.MonacoEnvironment = { getWorker: () => new editorWorker() }
loader.config({ monaco })

registerTypstLanguage(monaco)
monaco.editor.defineTheme('liquid-glass-light', buildMonacoTheme({}))

// Module-level refs so completion providers (registered once) always see fresh data
const globalBibEntries: { current: BibEntry[] } = { current: [] }
const globalAssets: { current: string[] } = { current: [] }

let completionProviderRegistered = false
function ensureCompletionProvider() {
  if (completionProviderRegistered) return
  completionProviderRegistered = true

  // Inject suggest widget structural overrides after Monaco's own styles so
  // they win. Theme colors are set via buildMonacoTheme; this handles geometry.
  if (!document.getElementById('glyph-suggest-overrides')) {
    const style = document.createElement('style')
    style.id = 'glyph-suggest-overrides'
    style.textContent = `
      .suggest-widget {
        border-radius: 10px !important;
        backdrop-filter: blur(28px) saturate(200%) !important;
        -webkit-backdrop-filter: blur(28px) saturate(200%) !important;
        box-shadow: 0 8px 32px rgba(0,40,120,0.13), 0 2px 8px rgba(0,0,0,0.07),
                    inset 0 1px 0 rgba(255,255,255,0.9) !important;
        overflow: hidden !important;
        max-width: 320px !important;
      }
      /* Hide the overflowing right-side documentation panel */
      .suggest-widget .details,
      .suggest-widget > .details,
      .suggest-widget-details {
        display: none !important;
      }
      .suggest-widget .suggest-status-bar {
        display: none !important;
      }
      .suggest-widget .monaco-list-row {
        border-radius: 6px !important;
        margin: 1px 4px !important;
      }
      /* Inline author/year label */
      .suggest-widget .details-label {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        font-size: 11px !important;
        opacity: 0.6 !important;
      }
      /* Hide generic file-type icon */
      .suggest-widget .suggest-icon,
      .suggest-widget .codicon-symbol-reference {
        display: none !important;
      }
      /* Detail / documentation panel */
      .suggest-widget-details,
      .editor-widget.suggest-widget .details {
        border-radius: var(--radius, 10px) !important;
        border: 1px solid rgba(255,255,255,0.8) !important;
        background: rgba(244, 247, 255, 0.95) !important;
        backdrop-filter: blur(28px) saturate(200%) !important;
        -webkit-backdrop-filter: blur(28px) saturate(200%) !important;
        box-shadow: 0 8px 32px rgba(0,40,120,0.13), 0 2px 8px rgba(0,0,0,0.07),
                    inset 0 1px 0 rgba(255,255,255,0.9) !important;
        max-width: 280px !important;
      }
    `
    document.head.appendChild(style)
  }

  monaco.languages.registerCompletionItemProvider(TYPST_LANGUAGE_ID, {
    triggerCharacters: ['"', '/'],
    provideCompletionItems: (model, position) => {
      const textUntil = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      })
      const match = textUntil.match(/#image\("([^"]*)$/)
      if (!match) return { suggestions: [] }

      const partial = match[1].toLowerCase()
      const assets = globalAssets.current
      const filtered = partial
        ? assets.filter(a => a.toLowerCase().includes(partial))
        : assets

      const replaceRange: monaco.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column - match[1].length,
        endColumn: position.column,
      }

      return {
        suggestions: filtered.map(asset => ({
          label: asset,
          kind: monaco.languages.CompletionItemKind.File,
          detail: asset.split('/').pop(),
          insertText: asset,
          range: replaceRange,
        }))
      }
    }
  })

  monaco.languages.registerCompletionItemProvider(TYPST_LANGUAGE_ID, {
    triggerCharacters: ['@'],
    provideCompletionItems: (model, position) => {
      const textUntil = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      })
      const match = textUntil.match(/@([\w-]*)$/)
      if (!match) return { suggestions: [] }

      const partial = match[1].toLowerCase()
      const entries = globalBibEntries.current
      const filtered = partial
        ? entries.filter(e =>
            e.key.toLowerCase().includes(partial) ||
            e.author?.toLowerCase().includes(partial) ||
            e.title?.toLowerCase().includes(partial)
          )
        : entries

      const replaceRange: monaco.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column - match[1].length,
        endColumn: position.column,
      }

      return {
        suggestions: filtered.map(e => ({
          label: e.key,
          kind: monaco.languages.CompletionItemKind.Reference,
          detail: [firstAuthorLastName(e.author), e.year].filter(Boolean).join(', '),
          documentation: { value: formatBibEntry(e), isTrusted: true },
          insertText: e.key,
          range: replaceRange,
        }))
      }
    }
  })
}

interface PaletteState {
  open: boolean
  x: number
  y: number
  commands: SlashCommand[]
  selectedIndex: number
}

interface Props {
  value: string
  filePath: string | null
  bookRoot?: string | null
  onChange: (value: string) => void
  tokenColors: TokenColors
}

export function EditorPane({ value, filePath, bookRoot, onChange, tokenColors }: Props) {
  useEffect(() => {
    monaco.editor.defineTheme('liquid-glass-light', buildMonacoTheme(tokenColors))
    monaco.editor.setTheme('liquid-glass-light')
  }, [tokenColors])

  // Load .bib files — from book root when in book mode, otherwise from file's directory
  useEffect(() => {
    if (bookRoot) {
      window.api.fileReadBibsFromDir(bookRoot).then(contents => {
        globalBibEntries.current = contents.flatMap(c => parseBib(c))
      })
    } else if (filePath) {
      window.api.fileReadBibs(filePath).then(contents => {
        globalBibEntries.current = contents.flatMap(c => parseBib(c))
      })
    } else {
      globalBibEntries.current = []
    }
  }, [filePath, bookRoot])

  // Load asset list for #image() completions
  useEffect(() => {
    if (bookRoot) {
      window.api.bookListAssets(bookRoot).then(assets => {
        globalAssets.current = assets
      })
    } else {
      globalAssets.current = []
    }
  }, [bookRoot])

  const [fontSize, setFontSize] = useState(14)

  const [findOpen, setFindOpen] = useState(false)
  const [findShowReplace, setFindShowReplace] = useState(false)
  const [findQuery, setFindQuery] = useState('')

  // Stable ref so handleMount closure can always call latest openFind
  const openFindRef = useRef<(showReplace: boolean) => void>(() => {})
  openFindRef.current = (showReplace: boolean) => {
    const ed = editorRef.current
    const selection = ed?.getSelection()
    const model = ed?.getModel()
    const selected = (selection && model) ? model.getValueInRange(selection).trim() : ''
    if (selected) setFindQuery(selected)
    setFindShowReplace(showReplace)
    setFindOpen(true)
  }

  const [palette, setPalette] = useState<PaletteState>({
    open: false, x: 0, y: 0, commands: [], selectedIndex: 0
  })
  const paletteRef = useRef(palette)
  paletteRef.current = palette

  const editorRef    = useRef<editor.IStandaloneCodeEditor | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const slashPosRef  = useRef<{ lineNumber: number; column: number } | null>(null)

  const doInsert = useCallback((cmd: SlashCommand) => {
    const ed    = editorRef.current
    const slash = slashPosRef.current
    if (!ed || !slash) return
    const pos = ed.getPosition()
    if (!pos) return
    slashPosRef.current = null
    setPalette(p => ({ ...p, open: false }))
    const sl = slash.lineNumber, sc = slash.column
    const el = pos.lineNumber,   ec = pos.column
    const snippet = cmd.snippet
    setTimeout(() => {
      ed.setSelection(new monaco.Selection(sl, sc, el, ec))
      ed.focus()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctrl = ed.getContribution('snippetController2') as any
      if (ctrl?.insert) {
        ctrl.insert(snippet)
      } else {
        ed.trigger('slash', 'editor.action.insertSnippet', { snippet })
      }
    }, 0)
  }, [])

  const closePalette = useCallback(() => {
    slashPosRef.current = null
    setPalette(p => ({ ...p, open: false }))
  }, [])

  const doInsertRef  = useRef(doInsert)
  const closePalRef  = useRef(closePalette)
  doInsertRef.current  = doInsert
  closePalRef.current  = closePalette

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: KeyboardEvent) => {
      if (!paletteRef.current.open) return
      if (e.key === 'Enter') {
        e.stopPropagation(); e.preventDefault()
        const cmd = paletteRef.current.commands[paletteRef.current.selectedIndex]
        if (cmd) doInsertRef.current(cmd)
      } else if (e.key === 'ArrowDown') {
        e.stopPropagation(); e.preventDefault()
        setPalette(p => ({ ...p, selectedIndex: Math.min(p.commands.length - 1, p.selectedIndex + 1) }))
      } else if (e.key === 'ArrowUp') {
        e.stopPropagation(); e.preventDefault()
        setPalette(p => ({ ...p, selectedIndex: Math.max(0, p.selectedIndex - 1) }))
      } else if (e.key === 'Escape') {
        e.stopPropagation(); e.preventDefault()
        closePalRef.current()
      }
    }
    el.addEventListener('keydown', handler, { capture: true })
    return () => el.removeEventListener('keydown', handler, { capture: true })
  }, [])

  const handleMount: OnMount = useCallback((ed) => {
    editorRef.current = ed
    monaco.editor.setTheme('liquid-glass-light')
    ed.addCommand(monaco.KeyCode.F1, () => {})
    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => openFindRef.current(false))
    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => openFindRef.current(true))

    // Cmd+B / Cmd+I: wrap selection in Typst bold (*) or italic (_)
    const wrapWithMarker = (marker: string) => {
      const model = ed.getModel()
      const sel = ed.getSelection()
      if (!model || !sel) return

      const mLen = marker.length

      if (sel.isEmpty()) {
        // No selection: insert pair and place cursor between
        const col = sel.startColumn
        ed.executeEdits('glyph-format', [{ range: sel, text: marker + marker }])
        ed.setPosition({ lineNumber: sel.startLineNumber, column: col + mLen })
        ed.focus()
        return
      }

      // Toggle off if selection is already wrapped with this marker
      if (sel.startColumn > mLen) {
        const beforeRange = {
          startLineNumber: sel.startLineNumber, startColumn: sel.startColumn - mLen,
          endLineNumber: sel.startLineNumber,   endColumn: sel.startColumn,
        }
        const afterRange = {
          startLineNumber: sel.endLineNumber, startColumn: sel.endColumn,
          endLineNumber: sel.endLineNumber,   endColumn: sel.endColumn + mLen,
        }
        if (model.getValueInRange(beforeRange) === marker && model.getValueInRange(afterRange) === marker) {
          // Remove markers (later position first to avoid column drift)
          ed.executeEdits('glyph-format', [
            { range: afterRange, text: '' },
            { range: beforeRange, text: '' },
          ])
          ed.setSelection({
            startLineNumber: sel.startLineNumber, startColumn: sel.startColumn - mLen,
            endLineNumber: sel.endLineNumber,     endColumn: sel.endColumn - mLen,
          })
          ed.focus()
          return
        }
      }

      // Wrap selection using snippet controller so cursor/selection lands correctly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctrl = (ed as any).getContribution('snippetController2')
      if (ctrl?.insert) {
        ctrl.insert(`${marker}$TM_SELECTED_TEXT${marker}`)
      } else {
        ed.executeEdits('glyph-format', [{ range: sel, text: marker + model.getValueInRange(sel) + marker }])
      }
      ed.focus()
    }

    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => wrapWithMarker('*'))
    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => wrapWithMarker('_'))

    ensureCompletionProvider()

    ed.onDidChangeModelContent(() => {
      const pos = ed.getPosition()
      if (!pos) return

      const line   = ed.getModel()?.getLineContent(pos.lineNumber) ?? ''
      const before = line.slice(0, pos.column - 1)
      const match  = before.match(/\/(\w*)$/)

      if (match) {
        const slashIdx = before.length - match[0].length
        const prevChar = before[slashIdx - 1]
        if (prevChar && /[a-zA-Z0-9:_]/.test(prevChar)) { closePalette(); return }

        if (!slashPosRef.current || slashPosRef.current.lineNumber !== pos.lineNumber) {
          slashPosRef.current = { lineNumber: pos.lineNumber, column: pos.column - match[0].length }
        }

        const commands = filterCommands(match[1])
        if (commands.length === 0) { closePalette(); return }

        const pixelPos = ed.getScrolledVisiblePosition(pos)
        const rect     = ed.getDomNode()?.getBoundingClientRect()
        if (pixelPos && rect) {
          setPalette({
            open: true,
            x: rect.left + pixelPos.left,
            y: rect.top + pixelPos.top + 22,
            commands,
            selectedIndex: 0
          })
        }
      } else {
        if (paletteRef.current.open) closePalette()
      }
    })

    ed.onDidChangeCursorPosition((e) => {
      const slash = slashPosRef.current
      if (!slash) return
      const { lineNumber, column } = e.position
      if (lineNumber !== slash.lineNumber || column < slash.column) closePalette()
    })
  }, [closePalette])

  useEffect(() => {
    editorRef.current?.updateOptions({ fontSize })
  }, [fontSize])

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, overflow: 'hidden', minWidth: 0, position: 'relative' }}
    >
      <MonacoEditor
        height="100%"
        language={TYPST_LANGUAGE_ID}
        value={value}
        theme="liquid-glass-light"
        onMount={handleMount}
        onChange={(v) => onChange(v ?? '')}
        options={{
          fontSize,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
          fontLigatures: true,
          lineHeight: 22,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          padding: { top: 20, bottom: 20 },
          renderLineHighlight: 'gutter',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: false, indentation: true },
          lineNumbersMinChars: 3,
          overviewRulerLanes: 0,
          stickyScroll: { enabled: false },
          quickSuggestions: false,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'off',
          wordBasedSuggestions: 'off',
          parameterHints: { enabled: false },
          contextmenu: false,
          scrollbar: { verticalScrollbarSize: 7, horizontalScrollbarSize: 7 },
          fixedOverflowWidgets: true
        }}
      />

      <SlashCommandPalette
        {...palette}
        onSelect={doInsert}
        onClose={closePalette}
      />

      <FindReplaceModal
        editorRef={editorRef}
        open={findOpen}
        showReplace={findShowReplace}
        query={findQuery}
        onQueryChange={setFindQuery}
        onShowReplaceChange={setFindShowReplace}
        onClose={() => setFindOpen(false)}
      />

      {/* Font size control */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.9)',
        borderRadius: 14,
        boxShadow: '0 1px 6px rgba(0,40,120,0.07)',
        padding: '2px 4px',
        zIndex: 5,
      }}>
        <button
          onClick={() => setFontSize(s => Math.max(10, s - 1))}
          disabled={fontSize <= 10}
          title="Decrease font size"
          style={fontSizeBtnStyle(fontSize <= 10)}
        >−</button>
        <span style={{
          fontSize: 10,
          color: 'var(--subtext)',
          minWidth: 28,
          textAlign: 'center',
          userSelect: 'none',
          letterSpacing: '-0.01em',
        }}>
          {fontSize}px
        </span>
        <button
          onClick={() => setFontSize(s => Math.min(24, s + 1))}
          disabled={fontSize >= 24}
          title="Increase font size"
          style={fontSizeBtnStyle(fontSize >= 24)}
        >+</button>
      </div>
    </div>
  )
}

function fontSizeBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    borderRadius: 6,
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.3 : 0.65,
    fontSize: 13,
    color: 'var(--subtext)',
    padding: 0,
    lineHeight: 1,
  }
}
