import { BOARD_HEIGHT, BOARD_WIDTH } from '../rules'
import type { BlockDropTheme } from '../themes'
import { align } from '../../shared/canvas'
import type {
  BoardGeometry,
  CellDraw,
  LineClearDraw,
  ThemeRenderer,
} from './types'

export const classicRenderer: ThemeRenderer = {
  drawBackground(context, theme, geometry) {
    const { offsetX, offsetY, width, height } = geometry
    context.fillStyle = theme.board.background
    context.fillRect(offsetX, offsetY, width, height)

    context.strokeStyle = theme.board.grid
    context.lineWidth = theme.board.gridWidth
    context.beginPath()
    const cell = geometry.cell
    for (let x = 0; x <= BOARD_WIDTH; x += 1) {
      context.moveTo(offsetX + x * cell, offsetY)
      context.lineTo(offsetX + x * cell, offsetY + height)
    }
    for (let y = 0; y <= BOARD_HEIGHT; y += 1) {
      context.moveTo(offsetX, offsetY + y * cell)
      context.lineTo(offsetX + width, offsetY + y * cell)
    }
    context.stroke()
  },

  drawCell(context, theme, cell) {
    drawClassicCell(context, theme, cell, cell.x, cell.y, cell.type)
  },

  drawGhostCell(context, theme, cell) {
    const { cell: size, offsetX, offsetY, ratio, x, y, type } = cell
    const left = align(offsetX + x * size, ratio)
    const top = align(offsetY + y * size, ratio)
    const right = align(offsetX + (x + 1) * size, ratio)
    const bottom = align(offsetY + (y + 1) * size, ratio)
    const inset = Math.max(2 / ratio, Math.round(size * 0.12 * ratio) / ratio)
    const innerLeft = align(left + inset, ratio)
    const innerTop = align(top + inset, ratio)
    const innerRight = align(right - inset, ratio)
    const innerBottom = align(bottom - inset, ratio)
    const color = theme.pieces[type]

    context.fillStyle = `${color}14`
    context.fillRect(
      innerLeft,
      innerTop,
      innerRight - innerLeft,
      innerBottom - innerTop,
    )
    context.strokeStyle = `${color}73`
    context.lineWidth = 2
    context.strokeRect(
      innerLeft + 1 / ratio,
      innerTop + 1 / ratio,
      innerRight - innerLeft - 2 / ratio,
      innerBottom - innerTop - 2 / ratio,
    )
  },

  drawLineClear(context, theme, draw) {
    drawClassicClearCells(context, theme, draw)
    const intensity = 0.3 + Math.sin(draw.progress * Math.PI) * 0.7
    context.fillStyle = `rgb(248 250 252 / ${intensity})`
    for (const row of draw.rows) {
      context.fillRect(
        draw.offsetX,
        draw.offsetY + row * draw.cell,
        draw.width,
        draw.cell,
      )
    }
  },
}

function drawClassicCell(
  context: CanvasRenderingContext2D,
  theme: BlockDropTheme,
  geometry: BoardGeometry,
  x: number,
  y: number,
  type: CellDraw['type'],
): void {
  const { cell: size, offsetX, offsetY, ratio } = geometry
  const left = align(offsetX + x * size, ratio)
  const top = align(offsetY + y * size, ratio)
  const right = align(offsetX + (x + 1) * size, ratio)
  const bottom = align(offsetY + (y + 1) * size, ratio)
  const edge = Math.max(1 / ratio, Math.round(size * 0.08 * ratio) / ratio)
  const innerLeft = align(left + edge, ratio)
  const innerTop = align(top + edge, ratio)
  const innerRight = align(right - edge, ratio)
  const innerBottom = align(bottom - edge, ratio)

  context.fillStyle = theme.pieces[type]
  context.fillRect(
    innerLeft,
    innerTop,
    innerRight - innerLeft,
    innerBottom - innerTop,
  )
  context.fillStyle = 'rgb(255 255 255 / 28%)'
  context.fillRect(innerLeft, innerTop, innerRight - innerLeft, edge)
  context.fillRect(innerLeft, innerTop, edge, innerBottom - innerTop)
  context.fillStyle = 'rgb(0 0 0 / 22%)'
  context.fillRect(
    innerLeft,
    innerBottom - edge,
    innerRight - innerLeft,
    edge,
  )
  context.fillRect(
    innerRight - edge,
    innerTop,
    edge,
    innerBottom - innerTop,
  )
}

function drawClassicClearCells(
  context: CanvasRenderingContext2D,
  theme: BlockDropTheme,
  draw: LineClearDraw,
): void {
  for (const y of draw.rows) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      const type = draw.board[y][x]
      if (type === null) continue
      drawClassicCell(context, theme, draw, x, y, type)
    }
  }
}
