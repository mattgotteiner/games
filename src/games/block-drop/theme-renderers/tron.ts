import { BOARD_HEIGHT, BOARD_WIDTH, TETROMINOES } from '../rules'
import type { BlockDropTheme } from '../themes'
import { align, alpha, clamp01, ease, hash } from './shared'
import type { BoardGeometry, CellDraw, ThemeRenderer } from './types'

type TronCellColors = Readonly<Record<'fill' | 'glow', string>>
const cellColorsByTheme = new WeakMap<
  BlockDropTheme,
  Readonly<Record<CellDraw['type'], TronCellColors>>
>()

function getCellColors(
  theme: BlockDropTheme,
): Readonly<Record<CellDraw['type'], TronCellColors>> {
  const cached = cellColorsByTheme.get(theme)
  if (cached !== undefined) return cached

  const colors = {} as Record<CellDraw['type'], TronCellColors>
  for (const type of TETROMINOES) {
    colors[type] = {
      fill: alpha(theme.pieces[type], 0.16),
      glow: alpha(theme.pieces[type], 0.28),
    }
  }
  cellColorsByTheme.set(theme, colors)
  return colors
}

export const tronRenderer: ThemeRenderer = {
  drawBackground(context, theme, geometry) {
    const { offsetX, offsetY, width, height, cell } = geometry
    const { ratio } = geometry
    context.fillStyle = theme.board.background
    context.fillRect(offsetX, offsetY, width, height)

    context.strokeStyle = theme.board.grid
    context.lineWidth = theme.board.gridWidth
    context.beginPath()
    for (let x = 0; x <= BOARD_WIDTH; x += 1) {
      const lineX = align(offsetX + x * cell, ratio)
      context.moveTo(lineX, offsetY)
      context.lineTo(lineX, offsetY + height)
    }
    for (let y = 0; y <= BOARD_HEIGHT; y += 1) {
      const lineY = align(offsetY + y * cell, ratio)
      context.moveTo(offsetX, lineY)
      context.lineTo(offsetX + width, lineY)
    }
    context.stroke()

    const horizon = context.createLinearGradient(
      0,
      offsetY + height * 0.6,
      0,
      offsetY + height,
    )
    horizon.addColorStop(0, 'rgb(0 229 255 / 0%)')
    horizon.addColorStop(1, 'rgb(0 229 255 / 9%)')
    context.fillStyle = horizon
    context.fillRect(offsetX, offsetY + height * 0.6, width, height * 0.4)
  },

  drawCell(context, theme, cell) {
    drawTronCell(context, theme, cell, cell.x, cell.y, cell.type)
  },

  drawGhostCell(context, theme, cell) {
    const { cell: size, offsetX, offsetY, ratio, x, y, type } = cell
    const left = align(offsetX + x * size, ratio)
    const top = align(offsetY + y * size, ratio)
    const alignedSize = align(size, ratio)
    const inset = align(size * 0.14, ratio)
    context.save()
    context.setLineDash([size * 0.2, size * 0.12])
    context.strokeStyle = alpha(theme.pieces[type], 0.55)
    context.lineWidth = 1.5
    context.strokeRect(
      left + inset,
      top + inset,
      alignedSize - inset * 2,
      alignedSize - inset * 2,
    )
    context.restore()
  },

  drawLineClear(context, theme, draw) {
    const beamProgress = clamp01(draw.progress / 0.4)
    const shatterProgress = clamp01((draw.progress - 0.4) / 0.6)
    const beamX = beamProgress * draw.width

    context.save()
    context.globalAlpha = 1
    for (const row of draw.rows) {
      context.fillStyle = theme.tokens.text
      const rowTop = draw.offsetY + row * draw.cell
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const type = draw.board[row][x]
        if (type === null) continue
        const left = draw.offsetX + x * draw.cell
        if (shatterProgress === 0 && left + draw.cell > draw.offsetX + beamX) {
          context.globalAlpha = 1
          drawTronCell(context, theme, draw, x, row, type)
          continue
        }

        for (let slice = 0; slice < 4; slice += 1) {
          const offset =
            (hash(x, row, slice) - 0.5) *
            draw.cell *
            2.2 *
            ease(shatterProgress)
          const opacity =
            (1 - shatterProgress) *
            (0.55 + 0.45 * hash(x, row, slice + 9))
          context.globalAlpha = opacity
          context.fillRect(
            left + draw.cell * 0.12 + offset,
            rowTop + draw.cell * (0.14 + slice * 0.19),
            draw.cell * 0.76,
            draw.cell * 0.11,
          )
        }
      }

      if (shatterProgress !== 0) continue
      context.globalAlpha = 1
      const beam = draw.offsetX + beamX
      const trailStart = Math.max(draw.offsetX, beam - draw.cell * 3)
      const trailWidth = Math.max(0, beam - trailStart)
      if (trailWidth > 0) {
        const trail = context.createLinearGradient(
          trailStart,
          0,
          beam,
          0,
        )
        trail.addColorStop(0, 'rgb(0 229 255 / 0%)')
        trail.addColorStop(1, 'rgb(0 229 255 / 45%)')
        context.fillStyle = trail
        context.fillRect(trailStart, rowTop, trailWidth, draw.cell)
      }
      context.fillStyle = '#ffffff'
      context.fillRect(beam - 1.5, rowTop - draw.cell * 0.15, 3, draw.cell * 1.3)
    }
    context.restore()
  },
}

function drawTronCell(
  context: CanvasRenderingContext2D,
  theme: Parameters<ThemeRenderer['drawCell']>[1],
  geometry: BoardGeometry,
  x: number,
  y: number,
  type: CellDraw['type'],
): void {
  const { cell: size, offsetX, offsetY, ratio } = geometry
  const left = align(offsetX + x * size, ratio)
  const top = align(offsetY + y * size, ratio)
  const alignedSize = align(size, ratio)
  const inset = align(size * 0.12, ratio)
  const inner = alignedSize - inset * 2
  const colors = getCellColors(theme)[type]

  context.fillStyle = theme.board.background
  context.fillRect(left, top, alignedSize, alignedSize)
  context.fillStyle = colors.fill
  context.fillRect(left + inset, top + inset, inner, inner)
  context.strokeStyle = colors.glow
  context.lineWidth = size * 0.2
  context.strokeRect(left + inset, top + inset, inner, inner)
  context.strokeStyle = theme.pieces[type]
  context.lineWidth = Math.max(1.5, size * 0.07)
  context.strokeRect(left + inset, top + inset, inner, inner)
}
