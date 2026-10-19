import type { Tetromino } from './rules'

export type BlockDropThemeId =
  | 'classic'
  | 'tron'
  | 'chocolate'
  | 'nature'
  | 'sketchbook'
  | 'stained-glass'

export const BLOCK_DROP_THEME_ORDER: ReadonlyArray<BlockDropThemeId> = [
  'classic',
  'tron',
  'chocolate',
  'nature',
  'sketchbook',
  'stained-glass',
]

export type BlockDropToken =
  | 'page'
  | 'text'
  | 'text-muted'
  | 'label'
  | 'accent'
  | 'panel'
  | 'panel-bg'
  | 'panel-border'
  | 'panel-shadow'
  | 'card-bg'
  | 'card-border'
  | 'card-shadow'
  | 'help-shadow'
  | 'primary-bg'
  | 'primary-hover-bg'
  | 'primary-text'
  | 'primary-shadow'
  | 'primary-hover-shadow'
  | 'secondary-bg'
  | 'secondary-hover-bg'
  | 'secondary-border'
  | 'secondary-text'
  | 'control-bg'
  | 'control-border'
  | 'control-text'
  | 'focus'
  | 'press'
  | 'swatch-ring'
  | 'board-backdrop'
  | 'scrim'
  | 'dialog-scrim'
  | 'preview-empty'
  | 'callout-text'
  | 'callout-shadow'
  | 'radius-panel'
  | 'radius-control'
  | 'radius-score'
  | 'font-ui'
  | 'font-display'
  | 'cell-highlight'
  | 'cell-shadow'
  | 'score-border'
  | 'score-bg'
  | 'help-bg'
  | 'quiet-bg'
  | 'quiet-text'
  | 'quiet-border'
  | 'quiet-hover-bg'
  | 'quiet-hover-border'
  | 'body-muted'
  | 'status-text'
  | 'preview-name'
  | 'key-help'
  | 'difficulty-highlight'
  | 'clear-pulse'
  | 'glow'
  | 'label-shadow'

export interface BlockDropTheme {
  readonly id: BlockDropThemeId
  readonly label: string
  readonly pieces: Readonly<Record<Tetromino, string>>
  readonly board: {
    readonly background: string
    readonly grid: string
    readonly gridWidth: number
    readonly pausedVeil: string
    readonly gameOverVeil: string
  }
  readonly clearMs: number
  readonly metaThemeColor: string
  readonly tokens: Readonly<Record<BlockDropToken, string>>
}

const CLASSIC_STACK =
  'Inter, ui-rounded, "SF Pro Rounded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const TRON_STACK =
  'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace'
const NATURE_STACK =
  'ui-rounded, "SF Pro Rounded", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const SERIF_STACK =
  '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif'

export const BLOCK_DROP_THEMES: Readonly<
  Record<BlockDropThemeId, BlockDropTheme>
> = Object.freeze({
  classic: {
    id: 'classic',
    label: 'Classic',
    pieces: {
      I: '#38bdf8',
      J: '#818cf8',
      L: '#fb923c',
      O: '#facc15',
      S: '#4ade80',
      T: '#c084fc',
      Z: '#fb7185',
    },
    board: {
      background: '#07111f',
      grid: 'rgb(148 163 184 / 18%)',
      gridWidth: 1,
      pausedVeil: 'rgb(7 17 31 / 84%)',
      gameOverVeil: 'rgb(7 17 31 / 76%)',
    },
    clearMs: 360,
    metaThemeColor: '#162033',
    tokens: {
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
      'radius-panel': '1rem',
      'radius-control': '0.8rem',
      'radius-score': '0.7rem',
      'font-ui': CLASSIC_STACK,
      'font-display': CLASSIC_STACK,
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
    },
  },
  tron: {
    id: 'tron',
    label: 'Tron',
    pieces: {
      I: '#00e5ff',
      J: '#2f6bff',
      L: '#ff8a00',
      O: '#ffe600',
      S: '#39ff14',
      T: '#ff2bd6',
      Z: '#ff1f4b',
    },
    board: {
      background: '#03060c',
      grid: 'rgb(0 229 255 / 11%)',
      gridWidth: 1,
      pausedVeil: 'rgb(2 4 9 / 86%)',
      gameOverVeil: 'rgb(2 4 9 / 78%)',
    },
    clearMs: 640,
    metaThemeColor: '#020409',
    tokens: {
      page: '#020409',
      text: '#e6fbff',
      'text-muted': '#7fa9b8',
      label: '#00e5ff',
      accent: '#00e5ff',
      panel: '#050b14',
      'panel-bg': 'linear-gradient(180deg, rgb(5 11 20 / 94%), rgb(2 4 9 / 94%))',
      'panel-border': 'rgb(0 229 255 / 45%)',
      'panel-shadow': '0 0 1rem rgb(0 229 255 / 30%)',
      'card-bg': 'linear-gradient(180deg, #06101c, #020409)',
      'card-border': '#00e5ff',
      'card-shadow': '0 0 1rem rgb(0 229 255 / 30%)',
      'help-shadow': '0 0 1.5rem rgb(0 229 255 / 30%)',
      'primary-bg': '#00e5ff',
      'primary-hover-bg': '#7ff3ff',
      'primary-text': '#001018',
      'primary-shadow': '0 0 1rem rgb(0 229 255 / 35%)',
      'primary-hover-shadow': '0 0 1.25rem rgb(0 229 255 / 55%)',
      'secondary-bg': '#07131f',
      'secondary-hover-bg': '#0b2030',
      'secondary-border': '#1a6c80',
      'secondary-text': '#c8f6ff',
      'control-bg': '#04101a',
      'control-border': '#14758a',
      'control-text': '#8ff3ff',
      focus: '#ff2bd6',
      press: 'rgb(0 229 255 / 14%)',
      'swatch-ring': '#00e5ff',
      'board-backdrop': '#03060c',
      scrim: 'rgb(2 4 9 / 35%)',
      'dialog-scrim': 'rgb(2 4 9 / 78%)',
      'preview-empty': 'rgb(0 229 255 / 6%)',
      'callout-text': '#e6fbff',
      'callout-shadow': '0 0 0.5rem #00e5ff, 0 0 1.25rem rgb(0 229 255 / 70%)',
      'radius-panel': '0.25rem',
      'radius-control': '0.15rem',
      'radius-score': '0.25rem',
      'font-ui': TRON_STACK,
      'font-display': TRON_STACK,
      'cell-highlight': 'rgb(255 255 255 / 55%)',
      'cell-shadow': 'rgb(0 229 255 / 25%)',
      'score-border': 'rgb(0 229 255 / 35%)',
      'score-bg': 'rgb(2 4 9 / 65%)',
      'help-bg': 'linear-gradient(180deg, #06101c, #020409)',
      'quiet-bg': '#04101a',
      'quiet-text': '#c8f6ff',
      'quiet-border': '#0b5d70',
      'quiet-hover-bg': '#0b2030',
      'quiet-hover-border': '#00e5ff',
      'body-muted': '#7fa9b8',
      'status-text': '#7fa9b8',
      'preview-name': '#7fa9b8',
      'key-help': '#7fa9b8',
      'difficulty-highlight': '#00e5ff',
      'clear-pulse': 'rgb(0 229 255 / 24%)',
      glow: 'rgb(0 229 255 / 30%)',
      'label-shadow': '0 0 0.5rem rgb(0 229 255 / 60%)',
    },
  },
  chocolate: {
    id: 'chocolate',
    label: 'Chocolate',
    pieces: {
      I: '#5a301c',
      J: '#9bb35a',
      L: '#d9963f',
      O: '#a8714a',
      S: '#9fd8bf',
      T: '#f1e4cc',
      Z: '#c75b7a',
    },
    board: {
      background: '#2e0f14',
      grid: 'rgb(201 162 74 / 16%)',
      gridWidth: 1,
      pausedVeil: 'rgb(27 15 10 / 86%)',
      gameOverVeil: 'rgb(27 15 10 / 78%)',
    },
    clearMs: 840,
    metaThemeColor: '#1b0f0a',
    tokens: {
      page: '#1b0f0a', text: '#fbf1e3', 'text-muted': '#cdb59b', label: '#e3b866', accent: '#e3b866', panel: '#2b1911',
      'panel-bg': 'linear-gradient(160deg, #35201a, #24140d)', 'panel-border': '#6b4429', 'panel-shadow': '0 1rem 2.5rem rgb(0 0 0 / 22%)',
      'card-bg': 'linear-gradient(155deg, #3a2318, #1f110b 82%)', 'card-border': '#b8913f', 'card-shadow': '0 1rem 3rem rgb(0 0 0 / 55%)', 'help-shadow': '0 1.5rem 4rem rgb(0 0 0 / 55%)',
      'primary-bg': '#e3b866', 'primary-hover-bg': '#f0cd85', 'primary-text': '#2b1408', 'primary-shadow': '0 0.4rem 1.2rem rgb(0 0 0 / 25%)', 'primary-hover-shadow': '0 0.5rem 1.4rem rgb(0 0 0 / 35%)',
      'secondary-bg': '#3a2216', 'secondary-hover-bg': '#4a2c1d', 'secondary-border': '#7a5032', 'secondary-text': '#fbf1e3',
      'control-bg': '#3a2216', 'control-border': '#8e5d3b', 'control-text': '#f3dcc0', focus: '#ffd98a', press: 'rgb(0 0 0 / 22%)',
      'swatch-ring': '#b8913f', 'board-backdrop': '#2e0f14', scrim: 'rgb(27 15 10 / 30%)', 'dialog-scrim': 'rgb(27 15 10 / 78%)',
      'preview-empty': 'rgb(201 162 74 / 10%)', 'callout-text': '#fbf1e3', 'callout-shadow': '0 2px 0 #5a301c, 0 0.4rem 1rem rgb(0 0 0 / 60%)', 'radius-panel': '0.9rem', 'radius-control': '999px', 'radius-score': '0.7rem',
      'font-ui': CLASSIC_STACK, 'font-display': SERIF_STACK, 'cell-highlight': 'rgb(255 240 220 / 26%)', 'cell-shadow': 'rgb(0 0 0 / 32%)', 'score-border': 'rgb(227 184 102 / 25%)', 'score-bg': 'rgb(27 15 10 / 45%)', 'help-bg': 'linear-gradient(160deg, #35201a, #24140d)', 'quiet-bg': '#24140d', 'quiet-text': '#fbf1e3', 'quiet-border': '#6b4429', 'quiet-hover-bg': '#4a2c1d', 'quiet-hover-border': '#b8913f', 'body-muted': '#fbf1e3', 'status-text': '#cdb59b', 'preview-name': '#cdb59b', 'key-help': '#cdb59b', 'difficulty-highlight': '#e3b866', 'clear-pulse': 'rgb(227 184 102 / 24%)', glow: 'rgb(0 0 0 / 0%)', 'label-shadow': 'none',
    },
  },
  nature: {
    id: 'nature',
    label: 'Nature',
    pieces: {
      I: '#6fb3c8',
      J: '#8090b8',
      L: '#dcc79a',
      O: '#e6b843',
      S: '#86a95c',
      T: '#b08fcf',
      Z: '#c9654b',
    },
    board: {
      background: '#1e2419',
      grid: 'rgb(232 220 192 / 7%)',
      gridWidth: 1,
      pausedVeil: 'rgb(26 31 23 / 84%)',
      gameOverVeil: 'rgb(26 31 23 / 76%)',
    },
    clearMs: 800,
    metaThemeColor: '#1a1f17',
    tokens: {
      page: '#1a1f17', text: '#f1eadb', 'text-muted': '#b9b29f', label: '#a8c686', accent: '#a8c686', panel: '#232b20',
      'panel-bg': 'linear-gradient(160deg, #283224, #1f261c)', 'panel-border': '#4a5a40', 'panel-shadow': '0 1rem 2.5rem rgb(0 0 0 / 22%)',
      'card-bg': 'linear-gradient(155deg, #2e3a29, #1c2318 82%)', 'card-border': '#6b7d5a', 'card-shadow': '0 1rem 3rem rgb(0 0 0 / 55%)', 'help-shadow': '0 1.5rem 4rem rgb(0 0 0 / 55%)',
      'primary-bg': '#a8c686', 'primary-hover-bg': '#bdd6a0', 'primary-text': '#1a2414', 'primary-shadow': '0 0.4rem 1.2rem rgb(0 0 0 / 20%)', 'primary-hover-shadow': '0 0.5rem 1.4rem rgb(0 0 0 / 30%)',
      'secondary-bg': '#2c3628', 'secondary-hover-bg': '#364331', 'secondary-border': '#55684a', 'secondary-text': '#f1eadb',
      'control-bg': '#2c3628', 'control-border': '#62754e', 'control-text': '#f1eadb', focus: '#f2c14e', press: 'rgb(0 0 0 / 18%)',
      'swatch-ring': '#6b7d5a', 'board-backdrop': '#1e2419', scrim: 'rgb(26 31 23 / 28%)', 'dialog-scrim': 'rgb(26 31 23 / 78%)',
      'preview-empty': 'rgb(232 220 192 / 6%)', 'callout-text': '#f1eadb', 'callout-shadow': '0 2px 1rem rgb(0 0 0 / 60%)', 'radius-panel': '1.4rem', 'radius-control': '1.1rem', 'radius-score': '0.7rem',
      'font-ui': NATURE_STACK, 'font-display': NATURE_STACK, 'cell-highlight': 'rgb(255 255 255 / 28%)', 'cell-shadow': 'rgb(0 0 0 / 22%)', 'score-border': 'rgb(168 198 134 / 25%)', 'score-bg': 'rgb(26 31 23 / 45%)', 'help-bg': 'linear-gradient(160deg, #283224, #1f261c)', 'quiet-bg': '#1f261c', 'quiet-text': '#f1eadb', 'quiet-border': '#4a5a40', 'quiet-hover-bg': '#364331', 'quiet-hover-border': '#a8c686', 'body-muted': '#f1eadb', 'status-text': '#b9b29f', 'preview-name': '#b9b29f', 'key-help': '#b9b29f', 'difficulty-highlight': '#a8c686', 'clear-pulse': 'rgb(168 198 134 / 24%)', glow: 'rgb(0 0 0 / 0%)', 'label-shadow': 'none',
    },
  },
  sketchbook: {
    id: 'sketchbook',
    label: 'Sketchbook',
    pieces: {
      I: '#3d8fd1',
      J: '#2c4f9e',
      L: '#e07b28',
      O: '#e8c22c',
      S: '#4b9e3f',
      T: '#8d4fb3',
      Z: '#d1433a',
    },
    board: {
      background: '#fbf8f0',
      grid: 'rgb(127 166 207 / 32%)',
      gridWidth: 1,
      pausedVeil: 'rgb(239 233 220 / 86%)',
      gameOverVeil: 'rgb(239 233 220 / 80%)',
    },
    clearMs: 760,
    metaThemeColor: '#efe9dc',
    tokens: {
      page: '#efe9dc', text: '#2b2a28', 'text-muted': '#5f5a52', label: '#b8322a', accent: '#1f6fd1', panel: '#fbf8f0',
      'panel-bg': '#fbf8f0', 'panel-border': '#8a8172', 'panel-shadow': '3px 4px 0 rgb(43 42 40 / 22%)',
      'card-bg': '#fffdf7', 'card-border': '#3a3a3a', 'card-shadow': '3px 4px 0 rgb(43 42 40 / 22%)', 'help-shadow': '3px 4px 0 rgb(43 42 40 / 22%)',
      'primary-bg': '#2b2a28', 'primary-hover-bg': '#45433f', 'primary-text': '#fbf8f0', 'primary-shadow': '3px 4px 0 rgb(43 42 40 / 22%)', 'primary-hover-shadow': '3px 5px 0 rgb(43 42 40 / 28%)',
      'secondary-bg': '#fffdf7', 'secondary-hover-bg': '#f3eee2', 'secondary-border': '#7a7163', 'secondary-text': '#2b2a28',
      'control-bg': '#fffdf7', 'control-border': '#7a7163', 'control-text': '#2b2a28', focus: '#1f6fd1', press: 'rgb(43 42 40 / 10%)',
      'swatch-ring': '#8a8172', 'board-backdrop': '#fbf8f0', scrim: 'rgb(239 233 220 / 35%)', 'dialog-scrim': 'rgb(43 42 40 / 45%)',
      'preview-empty': 'rgb(127 166 207 / 18%)', 'callout-text': '#2b2a28', 'callout-shadow': '0 0 0.35rem #fbf8f0, 0 0 0.2rem #fbf8f0', 'radius-panel': '0.35rem', 'radius-control': '0.35rem', 'radius-score': '0.35rem',
      'font-ui': CLASSIC_STACK, 'font-display': '"Segoe Print", "Bradley Hand", "Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive', 'cell-highlight': 'rgb(255 255 255 / 70%)', 'cell-shadow': 'rgb(43 42 40 / 18%)', 'score-border': 'rgb(58 58 58 / 30%)', 'score-bg': 'rgb(255 253 247 / 72%)', 'help-bg': '#fbf8f0', 'quiet-bg': '#fffdf7', 'quiet-text': '#2b2a28', 'quiet-border': '#7a7163', 'quiet-hover-bg': '#f3eee2', 'quiet-hover-border': '#1f6fd1', 'body-muted': '#5f5a52', 'status-text': '#5f5a52', 'preview-name': '#5f5a52', 'key-help': '#5f5a52', 'difficulty-highlight': '#1f6fd1', 'clear-pulse': 'rgb(31 111 209 / 24%)', glow: 'rgb(43 42 40 / 12%)', 'label-shadow': 'none',
    },
  },
  'stained-glass': {
    id: 'stained-glass',
    label: 'Stained Glass',
    pieces: {
      I: '#2bb3b1',
      J: '#1f4fb5',
      L: '#e39b17',
      O: '#f2cf4a',
      S: '#138a52',
      T: '#7b3fa6',
      Z: '#b3122e',
    },
    board: {
      background: '#121212',
      grid: '#262626',
      gridWidth: 2,
      pausedVeil: 'rgb(13 15 28 / 86%)',
      gameOverVeil: 'rgb(13 15 28 / 78%)',
    },
    clearMs: 720,
    metaThemeColor: '#0d0f1c',
    tokens: {
      page: '#0d0f1c', text: '#f4ecd8', 'text-muted': '#b7ad96', label: '#d4af37', accent: '#d4af37', panel: '#171a2e',
      'panel-bg': 'linear-gradient(160deg, #1c2038, #121527)', 'panel-border': '#3b3f63', 'panel-shadow': '0 0 2.5rem rgb(212 175 55 / 18%)',
      'card-bg': 'linear-gradient(180deg, #1f2440, #10132a 82%)', 'card-border': '#d4af37', 'card-shadow': '0 0 2.5rem rgb(212 175 55 / 18%)', 'help-shadow': '0 0 2.5rem rgb(212 175 55 / 18%)',
      'primary-bg': '#d4af37', 'primary-hover-bg': '#e6c65a', 'primary-text': '#1a1405', 'primary-shadow': '0 0 1rem rgb(212 175 55 / 25%)', 'primary-hover-shadow': '0 0 1.25rem rgb(212 175 55 / 40%)',
      'secondary-bg': '#20243d', 'secondary-hover-bg': '#2a2f4e', 'secondary-border': '#4a4f7a', 'secondary-text': '#f4ecd8',
      'control-bg': '#1b1f36', 'control-border': '#68709b', 'control-text': '#efe4c8', focus: '#7fd8ff', press: 'rgb(0 0 0 / 22%)',
      'swatch-ring': '#d4af37', 'board-backdrop': '#121212', scrim: 'rgb(13 15 28 / 30%)', 'dialog-scrim': 'rgb(13 15 28 / 78%)',
      'preview-empty': 'rgb(255 255 255 / 5%)', 'callout-text': '#f4ecd8', 'callout-shadow': '0 2px 0 #000, 0 0 1rem rgb(212 175 55 / 55%)', 'radius-panel': '0.6rem', 'radius-control': '0.5rem', 'radius-score': '0.5rem',
      'font-ui': CLASSIC_STACK, 'font-display': SERIF_STACK, 'cell-highlight': 'rgb(255 255 255 / 35%)', 'cell-shadow': 'rgb(0 0 0 / 32%)', 'score-border': 'rgb(212 175 55 / 30%)', 'score-bg': 'rgb(13 15 28 / 45%)', 'help-bg': 'linear-gradient(160deg, #1c2038, #121527)', 'quiet-bg': '#121527', 'quiet-text': '#f4ecd8', 'quiet-border': '#3b3f63', 'quiet-hover-bg': '#2a2f4e', 'quiet-hover-border': '#d4af37', 'body-muted': '#f4ecd8', 'status-text': '#b7ad96', 'preview-name': '#b7ad96', 'key-help': '#b7ad96', 'difficulty-highlight': '#d4af37', 'clear-pulse': 'rgb(212 175 55 / 24%)', glow: 'rgb(212 175 55 / 18%)', 'label-shadow': 'none',
    },
  },
})

export function isBlockDropThemeId(value: unknown): value is BlockDropThemeId {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(BLOCK_DROP_THEMES, value)
  )
}
