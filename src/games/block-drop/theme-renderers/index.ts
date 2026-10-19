import type { BlockDropThemeId } from '../themes'
import { chocolateRenderer } from './chocolate'
import { classicRenderer } from './classic'
import { tronRenderer } from './tron'
import type { ThemeRenderer } from './types'

export { classicRenderer } from './classic'
export { chocolateRenderer } from './chocolate'
export { tronRenderer } from './tron'
export type { BoardGeometry, CellDraw, LineClearDraw, ThemeRenderer } from './types'

export const IMPLEMENTED_BLOCK_DROP_THEME_ORDER: ReadonlyArray<BlockDropThemeId> = [
  'classic',
  'tron',
  'chocolate',
]

export const THEME_RENDERERS: Readonly<
  Partial<Record<BlockDropThemeId, ThemeRenderer>>
> = Object.freeze({
  classic: classicRenderer,
  tron: tronRenderer,
  chocolate: chocolateRenderer,
})

export function isBlockDropThemeImplemented(
  value: BlockDropThemeId,
): boolean {
  return THEME_RENDERERS[value] !== undefined
}
