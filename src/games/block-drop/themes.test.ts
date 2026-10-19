import { describe, expect, it } from 'vitest'
import {
  BLOCK_DROP_THEME_ORDER,
  BLOCK_DROP_THEMES,
} from './themes'

function luminance(hex: string): number {
  const rgb = [1, 3, 5].map((start) =>
    Number.parseInt(hex.slice(start, start + 2), 16) / 255,
  )
  const linear = rgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  )
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
}

function contrast(first: string, second: string): number {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

describe('Block Drop themes', () => {
  it('keeps seven distinct piece colors and doubled clear times below one second', () => {
    for (const id of BLOCK_DROP_THEME_ORDER) {
      const theme = BLOCK_DROP_THEMES[id]
      expect(new Set(Object.values(theme.pieces)).size, id).toBe(7)
      for (const color of Object.values(theme.pieces)) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i)
      }
      expect(theme.clearMs, id).toBeGreaterThanOrEqual(360)
      expect(theme.clearMs, id).toBeLessThanOrEqual(840)
    }
  })

  it('keeps decorative board frames out of every theme', () => {
    for (const id of BLOCK_DROP_THEME_ORDER) {
      const tokenNames = Object.keys(BLOCK_DROP_THEMES[id].tokens)
      expect(tokenNames, id).not.toContain('board-ring')
      expect(tokenNames, id).not.toContain('board-shadow')
      expect(tokenNames, id).toContain('swatch-ring')
    }
  })

  it('preserves Classic piece, board, and browser-chrome literals', () => {
    const classic = BLOCK_DROP_THEMES.classic
    expect(classic.pieces).toEqual({
      I: '#38bdf8',
      J: '#818cf8',
      L: '#fb923c',
      O: '#facc15',
      S: '#4ade80',
      T: '#c084fc',
      Z: '#fb7185',
    })
    expect(classic.board).toEqual({
      background: '#07111f',
      grid: 'rgb(148 163 184 / 18%)',
      gridWidth: 1,
      pausedVeil: 'rgb(7 17 31 / 84%)',
      gameOverVeil: 'rgb(7 17 31 / 76%)',
    })
    expect(classic.clearMs).toBe(360)
    expect(classic.metaThemeColor).toBe('#162033')
  })

  it('keeps theme text, focus, and control boundaries above contrast minimums', () => {
    for (const id of BLOCK_DROP_THEME_ORDER) {
      const { tokens } = BLOCK_DROP_THEMES[id]
      expect(contrast(tokens.text, tokens.panel), `${id} panel text`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(tokens['text-muted'], tokens.panel), `${id} muted panel text`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(tokens.label, tokens.panel), `${id} panel labels`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(tokens['primary-text'], tokens['primary-bg']), `${id} primary`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(tokens['secondary-text'], tokens['secondary-bg']), `${id} secondary`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(tokens['control-text'], tokens['control-bg']), `${id} controls`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(tokens.focus, tokens.page), `${id} focus`).toBeGreaterThanOrEqual(3)
      expect(contrast(tokens['control-border'], tokens.page), `${id} control border`).toBeGreaterThanOrEqual(3)
    }
  })
})
