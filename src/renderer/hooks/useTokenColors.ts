import { useState, useCallback } from 'react'
import { DEFAULT_TOKEN_COLORS, type TokenColors } from '../lib/tokenColors'

const STORAGE_KEY = 'typst-editor-token-colors'

function loadColors(): TokenColors {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...DEFAULT_TOKEN_COLORS, ...JSON.parse(stored) }
  } catch {}
  return { ...DEFAULT_TOKEN_COLORS }
}

export function useTokenColors() {
  const [colors, setColors] = useState<TokenColors>(loadColors)

  const updateColor = useCallback((id: string, color: string) => {
    setColors(prev => {
      const next = { ...prev, [id]: color }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const resetColors = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    setColors({ ...DEFAULT_TOKEN_COLORS })
  }, [])

  const resetOne = useCallback((id: string) => {
    setColors(prev => {
      const next = { ...prev, [id]: DEFAULT_TOKEN_COLORS[id] }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { colors, updateColor, resetColors, resetOne }
}
