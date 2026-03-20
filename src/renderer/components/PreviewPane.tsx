import React, { useRef, useState } from 'react'
import { usePdfRenderer } from '../hooks/usePdfRenderer'

interface Props {
  pdfBytes: Uint8Array | null
  error: string | null
  isCompiling: boolean
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3]

function zoomLabel(z: number): string {
  return z === 1 ? 'Fit' : `${Math.round(z * 100)}%`
}

export function PreviewPane({ pdfBytes, error, isCompiling }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoomIdx, setZoomIdx] = useState(2) // default: index 2 = 1.0 (Fit)
  const zoom = ZOOM_LEVELS[zoomIdx]

  usePdfRenderer(containerRef, pdfBytes, zoom)

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Scrollable pages */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: zoom > 1 ? 'auto' : 'hidden',
          position: 'relative',
          paddingTop: 4
        }}
      >
        {!pdfBytes && !error && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            color: 'var(--overlay)'
          }}>
            {isCompiling ? <><Spinner /><span style={{ fontSize: 12 }}>Compiling…</span></> : (
              <span style={{ fontSize: 13 }}>Start typing to see preview</span>
            )}
          </div>
        )}
      </div>

      {/* Zoom controls */}
      {pdfBytes && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          padding: '6px 0',
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.5)',
        }}>
          <button
            onClick={() => setZoomIdx(i => Math.max(0, i - 1))}
            disabled={zoomIdx === 0}
            style={zoomBtnStyle(zoomIdx === 0)}
            title="Zoom out"
          >−</button>
          <span style={{
            fontSize: 11,
            color: 'var(--subtext)',
            minWidth: 34,
            textAlign: 'center',
            userSelect: 'none',
            letterSpacing: '-0.01em',
          }}>
            {zoomLabel(zoom)}
          </span>
          <button
            onClick={() => setZoomIdx(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
            disabled={zoomIdx === ZOOM_LEVELS.length - 1}
            style={zoomBtnStyle(zoomIdx === ZOOM_LEVELS.length - 1)}
            title="Zoom in"
          >+</button>
        </div>
      )}

      {/* Error toast */}
      {error && <ErrorToast error={error} />}
    </div>
  )
}

function zoomBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    borderRadius: 6,
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.3 : 0.7,
    fontSize: 14,
    color: 'var(--subtext)',
    padding: 0,
    lineHeight: 1,
  }
}

function ErrorToast({ error }: { error: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(error)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: 14,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(220,38,38,0.25)',
      borderRadius: 'var(--radius)',
      padding: '8px 10px 8px 14px',
      maxWidth: '88%',
      zIndex: 10,
      boxShadow: '0 4px 20px rgba(220,38,38,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
    }}>
      <pre style={{
        flex: 1,
        margin: 0,
        whiteSpace: 'pre-wrap',
        fontFamily: "'JetBrains Mono', Menlo, monospace",
        fontSize: 11,
        color: 'var(--red)',
        userSelect: 'text',
        cursor: 'text',
        lineHeight: 1.5,
      }}>
        {error}
      </pre>
      <button
        onClick={copy}
        title="Copy error"
        style={{
          flexShrink: 0,
          background: copied ? 'rgba(22,163,74,0.10)' : 'rgba(220,38,38,0.07)',
          border: `1px solid ${copied ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.15)'}`,
          borderRadius: 6,
          padding: '3px 8px',
          fontSize: 11,
          color: copied ? 'var(--green)' : 'var(--red)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s',
          marginTop: 1,
        }}
      >
        {copied ? '✓' : '⎘'}
      </button>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 20,
      height: 20,
      borderRadius: '50%',
      border: '2px solid rgba(37,99,235,0.15)',
      borderTopColor: 'var(--accent)',
      animation: 'spin 0.7s linear infinite'
    }} />
  )
}
