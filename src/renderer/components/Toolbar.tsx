import React from 'react'

interface Props {
  filePath: string | null
  isDirty: boolean
  isCompiling: boolean
  hasError: boolean
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onSaveAs: () => void
  onExportPdf: () => void
  onExportDocx: () => void
  hasPdf: boolean
  lastSaved: Date | null
  onSettings: () => void
  onNewBook: () => void
  onOpenBook: () => void
  isBookOpen: boolean
}

function formatLastSaved(date: Date): string {
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 5) return 'Saved just now'
  if (diff < 60) return `Saved ${diff}s ago`
  if (diff < 3600) return `Saved ${Math.floor(diff / 60)}m ago`
  return `Saved at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

export function Toolbar({
  filePath, isDirty, isCompiling, hasError,
  onNew, onOpen, onSave, onSaveAs,
  onExportPdf, onExportDocx, hasPdf,
  lastSaved, onSettings,
  onNewBook, onOpenBook, isBookOpen
}: Props) {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  React.useEffect(() => {
    if (!lastSaved) return
    const id = setInterval(forceUpdate, 30000)
    return () => clearInterval(id)
  }, [lastSaved])

  const fileName = filePath ? filePath.split('/').pop()! : 'Untitled.typ'

  return (
    <div style={{
      height: 'var(--toolbar-h)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 16px',
      WebkitAppRegion: 'drag' as React.CSSProperties['WebkitAppRegion'],
      flexShrink: 0,
      position: 'relative',
      zIndex: 50,
      background: 'rgba(255,255,255,0.48)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderBottom: '1px solid rgba(255,255,255,0.6)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 0 rgba(0,0,0,0.04)'
    }}>
      {/* macOS traffic-light spacer */}
      <div style={{ width: 72, flexShrink: 0 }} />

      {/* Left buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        WebkitAppRegion: 'no-drag' as React.CSSProperties['WebkitAppRegion']
      }}>
        <Dropdown label="File" items={[
          { label: 'New', sub: '⌘N', action: onNew },
          { label: 'Open', sub: '⌘O', action: onOpen },
          { label: 'Save As', sub: '⌘⇧S', action: onSaveAs },
        ]} />
        <SaveBtn onSave={onSave} isDirty={isDirty} />
        <Dropdown label="Book" accent={isBookOpen} items={[
          { label: 'New Book', sub: 'Start from scratch', action: onNewBook },
          { label: 'Open Book', sub: 'Load an existing book', action: onOpenBook },
        ]} />
        <Dropdown label="Export" items={[
          { label: 'Export PDF', sub: '', action: onExportPdf, disabled: !hasPdf },
          { label: 'Export Word', sub: 'via Pandoc', action: onExportDocx },
        ]} />
      </div>

      {/* Center: file name + save status */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        WebkitAppRegion: 'drag' as React.CSSProperties['WebkitAppRegion'],
        cursor: 'default',
        minWidth: 0,
      }}>
        <span style={{
          color: 'var(--subtext)',
          fontSize: 12,
          fontWeight: 400,
          maxWidth: 320,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
          userSelect: 'none',
        }}>
          {fileName}{isDirty ? ' ·' : ''}
        </span>
        {!isDirty && lastSaved && filePath && (
          <span style={{ fontSize: 11, color: 'var(--overlay)', letterSpacing: '-0.01em', userSelect: 'none' }}>
            {formatLastSaved(lastSaved)}
          </span>
        )}
      </div>

      {/* Right: status + settings */}
      <div style={{
        WebkitAppRegion: 'no-drag' as React.CSSProperties['WebkitAppRegion'],
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <StatusPill isCompiling={isCompiling} hasError={hasError} />
        <GearBtn onClick={onSettings} title="Syntax colors" />
      </div>
    </div>
  )
}

// ── Shared dropdown ──────────────────────────────────────────────────────────

interface DropdownItem {
  label: string
  sub: string
  action: () => void
  disabled?: boolean
}

function Dropdown({ label, items, accent }: { label: string; items: DropdownItem[]; accent?: boolean }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: accent
            ? 'rgba(37,99,235,0.15)'
            : open ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.55)',
          color: accent ? 'var(--accent)' : 'var(--text)',
          border: `1px solid ${accent ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.8)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '4px 10px',
          fontSize: 12,
          fontWeight: accent ? 600 : 400,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
          transition: 'background 0.12s',
          letterSpacing: '-0.01em',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        {label}
        <span style={{ fontSize: 9, opacity: 0.5, marginTop: 1 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.85)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 32px rgba(0,40,120,0.10), 0 2px 8px rgba(0,0,0,0.06)',
          padding: '4px',
          minWidth: 150,
          zIndex: 1000,
        }}>
          {items.map(({ label, sub, action, disabled }) => (
            <button
              key={label}
              disabled={disabled}
              onClick={() => { if (!disabled) { action(); setOpen(false) } }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12,
                background: 'transparent',
                border: 'none',
                borderRadius: 7,
                padding: '7px 10px',
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(37,99,235,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{label}</span>
              {sub && <span style={{ fontSize: 10, color: 'var(--overlay)', whiteSpace: 'nowrap' }}>{sub}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Save button ──────────────────────────────────────────────────────────────

function SaveBtn({ onSave, isDirty }: { onSave: () => void; isDirty: boolean }) {
  const [saved, setSaved] = React.useState(false)
  const [hovered, setHovered] = React.useState(false)

  const handleClick = () => {
    onSave()
    setSaved(true)
    setTimeout(() => setSaved(false), 1400)
  }

  return (
    <button
      onClick={handleClick}
      title="Save (⌘S)"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: saved
          ? 'rgba(22,163,74,0.13)'
          : isDirty ? 'rgba(37,99,235,0.15)'
          : hovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.55)',
        color: saved ? 'var(--green)' : isDirty ? 'var(--accent)' : 'var(--text)',
        border: `1px solid ${saved ? 'rgba(22,163,74,0.25)' : isDirty ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.8)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '4px 11px',
        fontSize: 12,
        fontWeight: saved || isDirty ? 600 : 400,
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
        transition: 'background 0.18s, color 0.18s, border-color 0.18s',
        letterSpacing: '-0.01em',
        animation: saved ? 'save-pop 0.28s ease' : undefined,
        minWidth: 42,
        textAlign: 'center',
      }}
    >
      {saved
        ? <span style={{ animation: 'check-in 0.22s ease', display: 'inline-block' }}>✓</span>
        : 'Save'
      }
    </button>
  )
}

// ── Right-side widgets ───────────────────────────────────────────────────────

function GearBtn({ onClick, title }: { onClick: () => void; title?: string }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
        border: '1px solid rgba(255,255,255,0.8)',
        borderRadius: 'var(--radius-sm)',
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 14,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'background 0.12s',
        color: 'var(--subtext)'
      }}
    >⚙</button>
  )
}

function StatusPill({ isCompiling, hasError }: { isCompiling: boolean; hasError: boolean }) {
  let color = 'rgba(22,163,74,0.15)'
  let textColor = 'var(--green)'
  let dot = '●'
  let label = 'Ready'

  if (isCompiling) {
    color = 'rgba(217,119,6,0.12)'; textColor = 'var(--yellow)'; dot = '◌'; label = 'Compiling'
  } else if (hasError) {
    color = 'rgba(220,38,38,0.12)'; textColor = 'var(--red)'; dot = '●'; label = 'Error'
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: color, borderRadius: 20, padding: '3px 10px',
      border: `1px solid ${textColor}30`,
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)'
    }}>
      <span style={{ color: textColor, fontSize: 8, lineHeight: 1 }}>{dot}</span>
      <span style={{ color: textColor, fontSize: 11, fontWeight: 500 }}>{label}</span>
    </div>
  )
}
