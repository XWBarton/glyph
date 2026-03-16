import React from 'react'
import { TOKEN_DEFS, DEFAULT_TOKEN_COLORS, type TokenColors } from '../lib/tokenColors'

interface Props {
  open: boolean
  onClose: () => void
  colors: TokenColors
  onColorChange: (id: string, color: string) => void
  onResetOne: (id: string) => void
  onResetAll: () => void
}

export function SettingsPanel({
  open,
  onClose,
  colors,
  onColorChange,
  onResetOne,
  onResetAll
}: Props) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'rgba(0,0,0,0.08)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 320,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        borderLeft: '1px solid rgba(255,255,255,0.8)',
        boxShadow: '-8px 0 40px rgba(0,40,120,0.1), inset 1px 0 0 rgba(255,255,255,0.9)'
      }}>
        {/* Header */}
        <div style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          flexShrink: 0
        }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Syntax Colors
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.06)',
              border: 'none',
              borderRadius: '50%',
              width: 26,
              height: 26,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--subtext)',
              fontSize: 14,
              fontWeight: 500
            }}
          >
            ✕
          </button>
        </div>

        {/* Token list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {TOKEN_DEFS.map(def => {
            const color = colors[def.id] ?? def.defaultColor
            const isDefault = color === DEFAULT_TOKEN_COLORS[def.id]

            return (
              <div
                key={def.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '9px 18px',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Color swatch + picker */}
                <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: color,
                    border: '2px solid rgba(255,255,255,0.9)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)',
                    transition: 'transform 0.1s'
                  }} />
                  <input
                    type="color"
                    value={color}
                    onChange={e => onColorChange(def.id, e.target.value)}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer'
                    }}
                  />
                </label>

                {/* Label + description */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text)',
                    letterSpacing: '-0.01em'
                  }}>
                    {def.label}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--overlay)',
                    fontFamily: "'JetBrains Mono', Menlo, monospace",
                    marginTop: 1
                  }}>
                    {def.description}
                  </div>
                </div>

                {/* Reset individual token */}
                {!isDefault && (
                  <button
                    onClick={() => onResetOne(def.id)}
                    title="Reset to default"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--overlay)',
                      fontSize: 13,
                      padding: '2px 4px',
                      borderRadius: 4,
                      flexShrink: 0
                    }}
                  >
                    ↩
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          flexShrink: 0
        }}>
          <button
            onClick={onResetAll}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 0',
              fontSize: 13,
              color: 'var(--subtext)',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background 0.1s'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.09)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
          >
            Reset all to defaults
          </button>
        </div>
      </div>
    </>
  )
}
