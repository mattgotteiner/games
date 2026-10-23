import { BLOCK_DROP_THEMES, type BlockDropTheme } from '../block-drop/themes'
export interface BrickBurstLook {
  readonly id: 'classic'
  readonly label: string
  readonly bricks: readonly string[]
  readonly paddle: { readonly top: string; readonly mid: string; readonly bottom: string; readonly outline: string; readonly grip: string }
  readonly ball: { readonly body: string; readonly halo: string; readonly trail: string; readonly guide: string }
  readonly board: { readonly field: string; readonly glow: string; readonly grid: string; readonly danger: string; readonly pausedVeil: string; readonly gameOverVeil: string }
  readonly crack: string
  readonly rivet: string
  readonly metaThemeColor: string
  readonly tokens: BlockDropTheme['tokens']
}
export const BRICK_BURST_LOOKS: { readonly classic: BrickBurstLook } = {
  classic: {
    id: 'classic', label: 'Classic',
    bricks: ['#fb7185', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#38bdf8', '#818cf8', '#c084fc'],
    paddle: { top: '#a5f3fc', mid: '#67e8f9', bottom: '#22d3ee', outline: 'rgb(7 17 31 / 55%)', grip: 'rgb(7 17 31 / 35%)' },
    ball: { body: '#f8fafc', halo: 'rgb(103 232 249 / 35%)', trail: '#67e8f9', guide: '#67e8f9' },
    board: { field: '#07111f', glow: '#10223a', grid: 'rgb(148 163 184 / 6%)', danger: 'rgb(251 113 133 / 12%)', pausedVeil: 'rgb(7 17 31 / 84%)', gameOverVeil: 'rgb(7 17 31 / 76%)' },
    crack: 'rgb(248 250 252 / 85%)', rivet: 'rgb(248 250 252 / 70%)',
    metaThemeColor: BLOCK_DROP_THEMES.classic.metaThemeColor,
    tokens: BLOCK_DROP_THEMES.classic.tokens,
  },
}
