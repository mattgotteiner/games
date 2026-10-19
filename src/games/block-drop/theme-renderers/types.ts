import type { Board, Tetromino } from '../rules'
import type { BlockDropTheme } from '../themes'

export interface BoardGeometry {
  readonly cell: number
  readonly offsetX: number
  readonly offsetY: number
  readonly width: number
  readonly height: number
  readonly ratio: number
}

export interface CellDraw extends BoardGeometry {
  readonly x: number
  readonly y: number
  readonly type: Tetromino
  readonly seed: number
}

export interface LineClearDraw extends BoardGeometry {
  readonly rows: ReadonlyArray<number>
  readonly board: Board
  readonly progress: number
}

export interface ThemeRenderer {
  drawBackground(
    context: CanvasRenderingContext2D,
    theme: BlockDropTheme,
    geometry: BoardGeometry,
  ): void
  drawCell(
    context: CanvasRenderingContext2D,
    theme: BlockDropTheme,
    cell: CellDraw,
  ): void
  drawGhostCell(
    context: CanvasRenderingContext2D,
    theme: BlockDropTheme,
    cell: CellDraw,
  ): void
  drawLineClear(
    context: CanvasRenderingContext2D,
    theme: BlockDropTheme,
    draw: LineClearDraw,
  ): void
}
