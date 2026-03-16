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
  filePath,
  isDirty,
  isCompiling,
  hasError,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onExportPdf,
  onExportDocx,
  hasPdf,
  lastSaved,
  onSettings
}: Props) {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  // Refresh the "Saved Xs ago" text every 30s
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
      /* Glass toolbar sits directly on the window — let the gradient show through */
      background: 'rgba(255,255,255,0.48)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderBottom: '1px solid rgba(255,255,255,0.6)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 0 rgba(0,0,0,0.04)'
    }}>
      {/* macOS traffic-light spacer */}
      <div style={{ width: 72, flexShrink: 0 }} />

      {/* Buttons: no-drag */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        WebkitAppRegion: 'no-drag' as React.CSSProperties['WebkitAppRegion']
      }}>
        <GlassBtn onClick={onNew} title="New (⌘N)">New</GlassBtn>
        <GlassBtn onClick={onOpen} title="Open (⌘O)">Open</GlassBtn>
        <GlassBtn onClick={onSave} title="Save (⌘S)" accent={isDirty}>Save</GlassBtn>
        <GlassBtn onClick={onSaveAs} title="Save As (⌘⇧S)">Save As</GlassBtn>
        <div style={{ width: 1, height: 16, background: 'rgba(0,0,0,0.1)', margin: '0 2px' }} />
        <GlassBtn onClick={onExportPdf} title="Export PDF" disabled={!hasPdf}>Export PDF</GlassBtn>
        <GlassBtn onClick={onExportDocx} title="Export Word (.docx) via Pandoc">Export Word</GlassBtn>
      </div>

      {/* Center drag region — dragging here moves the window */}
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
          <span style={{
            fontSize: 11,
            color: 'var(--overlay)',
            letterSpacing: '-0.01em',
            userSelect: 'none',
          }}>
            {formatLastSaved(lastSaved)}
          </span>
        )}
      </div>

      {/* Right side: status + settings */}
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

function GlassBtn({
  children,
  onClick,
  title,
  accent,
  disabled
}: {
  children: React.ReactNode
  onClick: () => void
  title?: string
  accent?: boolean
  disabled?: boolean
}) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: disabled
          ? 'rgba(255,255,255,0.25)'
          : accent
            ? 'rgba(37, 99, 235, 0.15)'
            : hovered
              ? 'rgba(255,255,255,0.8)'
              : 'rgba(255,255,255,0.55)',
        color: disabled ? 'var(--overlay)' : accent ? 'var(--accent)' : 'var(--text)',
        border: `1px solid ${accent ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.8)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '4px 11px',
        fontSize: 12,
        fontWeight: accent ? 600 : 400,
        cursor: disabled ? 'default' : 'pointer',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
        transition: 'background 0.12s, box-shadow 0.12s',
        letterSpacing: '-0.01em'
      }}
    >
      {children}
    </button>
  )
}

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
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 14,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'background 0.12s',
        color: 'var(--subtext)'
      }}
    >
      ⚙
    </button>
  )
}

function StatusPill({ isCompiling, hasError }: { isCompiling: boolean; hasError: boolean }) {
  let color = 'rgba(22,163,74,0.15)'
  let textColor = 'var(--green)'
  let dot = '●'
  let label = 'Ready'

  if (isCompiling) {
    color = 'rgba(217,119,6,0.12)'
    textColor = 'var(--yellow)'
    dot = '◌'
    label = 'Compiling'
  } else if (hasError) {
    color = 'rgba(220,38,38,0.12)'
    textColor = 'var(--red)'
    dot = '●'
    label = 'Error'
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      background: color,
      borderRadius: 20,
      padding: '3px 10px',
      border: `1px solid ${textColor}30`,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)'
    }}>
      <span style={{ color: textColor, fontSize: 8, lineHeight: 1 }}>{dot}</span>
      <span style={{ color: textColor, fontSize: 11, fontWeight: 500 }}>{label}</span>
    </div>
  )
}
