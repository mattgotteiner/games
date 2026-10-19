import type { Tetromino } from './rules'
import { BLOCK_DROP_THEMES } from './themes'

export const TETROMINO_COLORS: Readonly<Record<Tetromino, string>> =
  BLOCK_DROP_THEMES.classic.pieces
