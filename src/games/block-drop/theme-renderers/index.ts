import type { BlockDropThemeId } from '../themes'
import { chocolateRenderer } from './chocolate'
import { classicRenderer } from './classic'
import { natureRenderer } from './nature'
import { sketchbookRenderer } from './sketchbook'
import { stainedGlassRenderer } from './stained-glass'
import { tronRenderer } from './tron'
import type { ThemeRenderer } from './types'

export { classicRenderer } from './classic'
export { chocolateRenderer } from './chocolate'
export { natureRenderer } from './nature'
export { sketchbookRenderer } from './sketchbook'
export { stainedGlassRenderer } from './stained-glass'
export { tronRenderer } from './tron'
export type { BoardGeometry, CellDraw, LineClearDraw, ThemeRenderer } from './types'

export const IMPLEMENTED_BLOCK_DROP_THEME_ORDER: ReadonlyArray<BlockDropThemeId> = [
  'classic',
  'tron',
  'chocolate',
  'nature',
  'sketchbook',
  'stained-glass',
]

export const THEME_RENDERERS: Readonly<
  Partial<Record<BlockDropThemeId, ThemeRenderer>>
> = Object.freeze({
  classic: classicRenderer,
  tron: tronRenderer,
  chocolate: chocolateRenderer,
  nature: natureRenderer,
  sketchbook: sketchbookRenderer,
  'stained-glass': stainedGlassRenderer,
})

export function isBlockDropThemeImplemented(
  value: BlockDropThemeId,
): boolean {
  return THEME_RENDERERS[value] !== undefined
}
