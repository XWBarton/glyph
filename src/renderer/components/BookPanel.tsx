import React, { useState, useRef, useEffect } from 'react'
import type { BookConfig, BookChapter } from '../hooks/useFileState'

function joinPath(base: string, rel: string): string {
  return base.replace(/\/$/, '') + '/' + rel.replace(/^\//, '')
}

type Section = 'front' | 'chapter' | 'back'

const SECTION_LABELS: Record<Section, string> = {
  front: 'Front Matter',
  chapter: 'Chapters',
  back: 'Back Matter',
}

interface Props {
  bookRoot: string
  bookConfig: BookConfig
  activeFilePath: string | null
  previewMode: 'chapter' | 'book'
  onActivate: (absolutePath: string) => void
  onSelectFullBook: () => void
  onUpdateConfig: (config: BookConfig) => void
  onClose: () => void
  onAddChapter: (title: string, section: Section) => void
}

export function BookPanel({
  bookRoot, bookConfig, activeFilePath, previewMode,
  onActivate, onSelectFullBook, onUpdateConfig, onClose, onAddChapter
}: Props) {
  const [addingSection, setAddingSection] = useState<Section | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [hoveredFile, setHoveredFile] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (addingSection) inputRef.current?.focus()
  }, [addingSection])

  const commitAdd = () => {
    if (newTitle.trim() && addingSection) onAddChapter(newTitle.trim(), addingSection)
    setNewTitle('')
    setAddingSection(null)
  }

  const cancelAdd = () => {
    setNewTitle('')
    setAddingSection(null)
  }

  const moveItem = (globalIndex: number, direction: -1 | 1) => {
    const chapters = [...bookConfig.chapters]
    const section = chapters[globalIndex].section ?? 'chapter'
    // Find adjacent item in the same section
    const candidates = chapters
      .map((c, i) => ({ c, i }))
      .filter(({ c, i }) => (c.section ?? 'chapter') === section && i !== globalIndex)
    const target = direction === -1
      ? candidates.filter(({ i }) => i < globalIndex).pop()
      : candidates.find(({ i }) => i > globalIndex)
    if (!target) return
    // Swap
    ;[chapters[globalIndex], chapters[target.i]] = [chapters[target.i], chapters[globalIndex]]
    onUpdateConfig({ ...bookConfig, chapters })
  }

  const removeItem = (index: number) => {
    if (!confirm(`Remove "${bookConfig.chapters[index].title}" from the book? The file will not be deleted.`)) return
    onUpdateConfig({ ...bookConfig, chapters: bookConfig.chapters.filter((_, i) => i !== index) })
  }

  const sections: Section[] = ['front', 'chapter', 'back']

  return (
    <div style={{
      width: 220,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 'var(--radius)',
      background: 'rgba(255,255,255,0.65)',
      border: '1px solid var(--glass-border)',
      boxShadow: 'var(--glass-shadow), inset 0 1px 0 rgba(255,255,255,0.95)',
      overflow: 'hidden',
      marginRight: 10,
    }}>
      {/* Book title — clickable for full book preview */}
      <button
        onClick={onSelectFullBook}
        title="Preview full book"
        style={{
          padding: '12px 14px 10px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
          background: previewMode === 'book' ? 'rgba(37,99,235,0.07)' : 'transparent',
          border: 'none',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span style={{
          flex: 1,
          fontWeight: 600,
          fontSize: 12,
          color: previewMode === 'book' ? 'var(--accent)' : 'var(--text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
        }}>
          {bookConfig.title}
        </span>
        <span style={{ fontSize: 9, color: previewMode === 'book' ? 'var(--accent)' : 'var(--overlay)', opacity: 0.7, flexShrink: 0 }}>
          {previewMode === 'book' ? '● full' : '◌ full'}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onClose() }}
          title="Close book"
          style={iconBtnStyle}
        >✕</button>
      </button>

      {/* Sections */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sections.map(section => {
          const items = bookConfig.chapters
            .map((c, i) => ({ c, i }))
            .filter(({ c }) => (c.section ?? 'chapter') === section)

          return (
            <div key={section}>
              {/* Section header */}
              <div style={{
                padding: '8px 14px 3px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <span style={{
                  flex: 1,
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--overlay)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {SECTION_LABELS[section]}
                </span>
                <button
                  onClick={() => setAddingSection(addingSection === section ? null : section)}
                  title={`Add to ${SECTION_LABELS[section]}`}
                  style={{ ...iconBtnStyle, fontSize: 12, opacity: 0.5 }}
                >+</button>
              </div>

              {/* Inline add input */}
              {addingSection === section && (
                <div style={{ padding: '2px 8px 4px', display: 'flex', gap: 4 }}>
                  <input
                    ref={inputRef}
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitAdd()
                      else if (e.key === 'Escape') cancelAdd()
                    }}
                    placeholder="Title"
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.8)',
                      border: '1px solid rgba(37,99,235,0.3)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 7px',
                      fontSize: 11,
                      color: 'var(--text)',
                      outline: 'none',
                      letterSpacing: '-0.01em',
                    }}
                  />
                  <button onClick={commitAdd} style={{ ...iconBtnStyle, opacity: 1, color: 'var(--green)', fontSize: 13 }}>✓</button>
                  <button onClick={cancelAdd} style={{ ...iconBtnStyle, opacity: 1, color: 'var(--overlay)', fontSize: 13 }}>✕</button>
                </div>
              )}

              {/* Items */}
              <div style={{ padding: '0 6px', marginBottom: 4 }}>
                {items.length === 0 && (
                  <div style={{ padding: '4px 8px', fontSize: 11, color: 'var(--overlay)', fontStyle: 'italic' }}>
                    Empty
                  </div>
                )}
                {items.map(({ c, i }) => {
                  const absPath = joinPath(bookRoot, c.file)
                  const isActive = activeFilePath === absPath && previewMode === 'chapter'
                  const isHovered = hoveredFile === c.file
                  return (
                    <div
                      key={c.file}
                      onMouseEnter={() => setHoveredFile(c.file)}
                      onMouseLeave={() => setHoveredFile(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: 6,
                        background: isActive ? 'rgba(37,99,235,0.10)' : isHovered ? 'rgba(0,0,0,0.03)' : 'transparent',
                        border: isActive ? '1px solid rgba(37,99,235,0.18)' : '1px solid transparent',
                        margin: '1px 0',
                        padding: '0 4px 0 8px',
                        gap: 2,
                        minHeight: 32,
                      }}
                    >
                      <button
                        onClick={() => onActivate(absPath)}
                        style={{
                          flex: 1,
                          background: 'none',
                          border: 'none',
                          padding: '5px 0',
                          textAlign: 'left',
                          cursor: 'pointer',
                          color: isActive ? 'var(--accent)' : 'var(--text)',
                          fontSize: 12,
                          fontWeight: isActive ? 600 : 400,
                          letterSpacing: '-0.01em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                        }}
                      >
                        {c.title}
                      </button>
                      <div style={{
                        display: 'flex',
                        gap: 2,
                        flexShrink: 0,
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.15s',
                      }}>
                        <ActionBtn onClick={() => moveItem(i, -1)} title="Move up">↑</ActionBtn>
                        <ActionBtn onClick={() => moveItem(i, 1)} title="Move down">↓</ActionBtn>
                        <ActionBtn onClick={() => removeItem(i)} title="Remove from book" danger>×</ActionBtn>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ActionBtn({ onClick, title, danger, children }: {
  onClick: () => void
  title: string
  danger?: boolean
  children: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? danger ? 'rgba(220,38,38,0.10)' : 'rgba(0,0,0,0.07)'
          : 'transparent',
        border: 'none',
        borderRadius: 5,
        width: 22,
        height: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: hovered
          ? danger ? 'var(--red)' : 'var(--text)'
          : 'var(--subtext)',
        fontSize: 13,
        lineHeight: 1,
        flexShrink: 0,
        transition: 'background 0.1s, color 0.1s',
      }}
    >
      {children}
    </button>
  )
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--subtext)',
  fontSize: 11,
  padding: '2px 3px',
  borderRadius: 4,
  lineHeight: 1,
  opacity: 0.65,
}
