import React, { useEffect, useRef } from 'react'
import { SLASH_COMMANDS, CATEGORY_LABELS, type SlashCommand } from '../lib/slashCommands'

interface Props {
  open: boolean
  x: number
  y: number
  commands: SlashCommand[]
  selectedIndex: number
  onSelect: (cmd: SlashCommand) => void
  onClose: () => void
}

export function SlashCommandPalette({ open, x, y, commands, selectedIndex, onSelect, onClose }: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLDivElement>(null)

  // Scroll selected item into view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!open || commands.length === 0) return null

  // Group by category, preserving order of first appearance
  const grouped: { category: SlashCommand['category']; items: SlashCommand[] }[] = []
  const seen = new Set<string>()
  for (const cmd of commands) {
    if (!seen.has(cmd.category)) {
      seen.add(cmd.category)
      grouped.push({ category: cmd.category, items: [] })
    }
    grouped.find(g => g.category === cmd.category)!.items.push(cmd)
  }

  // Adjust position so panel doesn't clip off screen
  const panelWidth = 288
  const panelMaxHeight = 320
  const adjustedX = Math.min(x, window.innerWidth - panelWidth - 8)
  const adjustedY = y + panelMaxHeight > window.innerHeight
    ? y - panelMaxHeight - 28
    : y

  let runningIndex = 0

  return (
    <>
      {/* Invisible backdrop to catch outside clicks */}
      <div
        onMouseDown={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 99 }}
      />

      <div
        style={{
          position: 'fixed',
          left: adjustedX,
          top: adjustedY,
          width: panelWidth,
          maxHeight: panelMaxHeight,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 12,
          boxShadow: '0 8px 40px rgba(0,40,120,0.13), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
          overflow: 'hidden',
        }}
      >
        <div ref={listRef} style={{ overflowY: 'auto', padding: '6px 0' }}>
          {grouped.map(({ category, items }) => (
            <div key={category}>
              {/* Category header */}
              <div style={{
                padding: '6px 12px 3px',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--overlay)'
              }}>
                {CATEGORY_LABELS[category]}
              </div>

              {items.map(cmd => {
                const idx = runningIndex++
                const isSelected = idx === selectedIndex
                return (
                  <div
                    key={cmd.id}
                    ref={isSelected ? selectedRef : undefined}
                    onMouseDown={(e) => { e.preventDefault(); onSelect(cmd) }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(37,99,235,0.10)' : 'transparent',
                      borderRadius: isSelected ? 8 : 0,
                      margin: isSelected ? '0 4px' : '0',
                      transition: 'background 0.08s'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: 7,
                      background: isSelected ? 'rgba(37,99,235,0.12)' : 'rgba(0,0,0,0.05)',
                      border: `1px solid ${isSelected ? 'rgba(37,99,235,0.2)' : 'rgba(0,0,0,0.06)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: isSelected ? 'var(--accent)' : 'var(--subtext)',
                      flexShrink: 0,
                      fontFamily: 'monospace',
                      letterSpacing: '-0.03em'
                    }}>
                      {cmd.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--text)',
                        letterSpacing: '-0.01em'
                      }}>
                        {cmd.label}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: 'var(--overlay)',
                        marginTop: 1,
                        fontFamily: "'JetBrains Mono', Menlo, monospace"
                      }}>
                        {cmd.description}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '6px 12px',
          borderTop: '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          gap: 12,
          alignItems: 'center'
        }}>
          <Hint keys={['↑', '↓']} label="navigate" />
          <Hint keys={['↵']} label="insert" />
          <Hint keys={['Esc']} label="close" />
        </div>
      </div>
    </>
  )
}

function Hint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--overlay)' }}>
      {keys.map(k => (
        <kbd key={k} style={{
          background: 'rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 4,
          padding: '1px 5px',
          fontFamily: 'system-ui',
          fontSize: 10
        }}>
          {k}
        </kbd>
      ))}
      <span style={{ marginLeft: 2 }}>{label}</span>
    </span>
  )
}
