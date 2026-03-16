import React, { useRef } from 'react'
import { usePdfRenderer } from '../hooks/usePdfRenderer'

interface Props {
  pdfBytes: Uint8Array | null
  error: string | null
  isCompiling: boolean
}

export function PreviewPane({ pdfBytes, error, isCompiling }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  usePdfRenderer(containerRef, pdfBytes)

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
          overflowX: 'hidden',
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

      {/* Error toast */}
      {error && (
        <div style={{
          position: 'absolute',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(220,38,38,0.25)',
          borderRadius: 'var(--radius)',
          padding: '8px 14px',
          maxWidth: '88%',
          zIndex: 10,
          whiteSpace: 'pre-wrap',
          fontFamily: "'JetBrains Mono', Menlo, monospace",
          fontSize: 11,
          color: 'var(--red)',
          pointerEvents: 'none',
          boxShadow: '0 4px 20px rgba(220,38,38,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
        }}>
          {error}
        </div>
      )}
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
