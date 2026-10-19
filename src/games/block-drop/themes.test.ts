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
      expect(theme.clearMs, id).toBeLessThanOrEqual(900)
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

  it('uses square-corner tokens across every theme', () => {
    for (const id of BLOCK_DROP_THEME_ORDER) {
      const { tokens } = BLOCK_DROP_THEMES[id]
      expect(tokens['radius-panel'], `${id} panels`).toBe('0')
      expect(tokens['radius-control'], `${id} controls`).toBe('0')
      expect(tokens['radius-score'], `${id} scores`).toBe('0')
    }
  })

  it('preserves the Classic piece, board, timing, browser, and token values', () => {
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
    expect(classic.tokens).toEqual({
      page: '#07111f',
      text: '#f8fafc',
      'text-muted': '#a8c4df',
      label: '#7dd3fc',
      accent: '#67e8f9',
      panel: '#132641',
      'panel-bg': 'linear-gradient(160deg, rgb(25 48 79 / 96%), rgb(12 27 47 / 96%))',
      'panel-border': '#2d4768',
      'panel-shadow': '0 1rem 2.5rem rgb(0 0 0 / 22%)',
      'card-bg': 'linear-gradient(155deg, #1a3557, #0a192d 82%)',
      'card-border': '#52749c',
      'card-shadow': '0 1rem 3rem rgb(0 0 0 / 55%)',
      'help-shadow': '0 1.5rem 4rem rgb(0 0 0 / 55%)',
      'primary-bg': '#67e8f9',
      'primary-hover-bg': '#a5f3fc',
      'primary-text': '#07111f',
      'primary-shadow': '0 0.4rem 1.2rem rgb(34 211 238 / 18%)',
      'primary-hover-shadow': '0 0.5rem 1.4rem rgb(34 211 238 / 28%)',
      'secondary-bg': '#1e3049',
      'secondary-hover-bg': '#254260',
      'secondary-border': '#3e5c82',
      'secondary-text': '#eff6ff',
      'control-bg': '#162942',
      // Raised from the old border literal to meet the 3:1 contrast minimum.
      'control-border': '#4a6c8f',
      'control-text': '#e0f2fe',
      focus: '#fbbf24',
      press: 'rgb(7 17 31 / 18%)',
      'swatch-ring': '#3a5b83',
      'board-backdrop': 'radial-gradient(circle at 50% 45%, #132641, #091525 70%)',
      scrim: 'rgb(7 17 31 / 24%)',
      'dialog-scrim': 'rgb(3 9 18 / 76%)',
      'preview-empty': 'rgb(148 163 184 / 10%)',
      'callout-text': '#f8fafc',
      'callout-shadow': '0 2px 1rem rgb(0 0 0 / 75%)',
      'radius-panel': '0',
      'radius-control': '0',
      'radius-score': '0',
      'font-ui': 'Inter, ui-rounded, "SF Pro Rounded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'font-display': 'Inter, ui-rounded, "SF Pro Rounded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'cell-highlight': 'rgb(255 255 255 / 28%)',
      'cell-shadow': 'rgb(0 0 0 / 22%)',
      'score-border': 'rgb(125 211 252 / 20%)',
      'score-bg': 'rgb(7 17 31 / 32%)',
      'help-bg': 'linear-gradient(160deg, #19304f, #0c1b2f)',
      'quiet-bg': '#101f34',
      'quiet-text': '#cbd5e1',
      'quiet-border': '#2d4768',
      'quiet-hover-bg': '#192d47',
      'quiet-hover-border': '#5b789d',
      'body-muted': '#cbd5e1',
      'status-text': '#cbd5e1',
      'preview-name': '#dbeafe',
      'key-help': '#8fa1b9',
      'difficulty-highlight': '#a5f3fc',
      'clear-pulse': 'rgb(125 211 252 / 24%)',
      glow: 'rgb(0 0 0 / 0%)',
      'label-shadow': 'none',
    })
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
