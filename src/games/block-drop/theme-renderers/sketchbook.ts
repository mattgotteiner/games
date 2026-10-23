import { BOARD_HEIGHT, BOARD_WIDTH } from '../rules'
import type { BlockDropTheme } from '../themes'
import { align, clamp01, ease, hash } from '../../shared/canvas'
import type { BoardGeometry, CellDraw, ThemeRenderer } from './types'

const graphite = '#3a3a3a'
const eraserPink = '#f4a6b4'
const eraserBlue = '#3d6fb6'

export const sketchbookRenderer: ThemeRenderer = {
  drawBackground(context, theme, geometry) {
    const { offsetX, offsetY, width, height, cell, ratio } = geometry
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

    context.strokeStyle = 'rgb(127 166 207 / 50%)'
    context.beginPath()
    for (let x = 0; x <= BOARD_WIDTH; x += 5) {
      const lineX = align(offsetX + x * cell, ratio)
      context.moveTo(lineX, offsetY)
      context.lineTo(lineX, offsetY + height)
    }
    for (let y = 0; y <= BOARD_HEIGHT; y += 5) {
      const lineY = align(offsetY + y * cell, ratio)
      context.moveTo(offsetX, lineY)
      context.lineTo(offsetX + width, lineY)
    }
    context.stroke()
  },

  drawCell(context, theme, cell) {
    drawSketchbookCell(
      context,
      theme,
      cell,
      cell.x,
      cell.y,
      cell.type,
      cell.seed,
    )
  },

  drawGhostCell(context, _theme, cell) {
    const { cell: size, offsetX, offsetY, x, y } = cell
    const inset = size * 0.12

    context.save()
    context.setLineDash([size * 0.12, size * 0.08])
    context.strokeStyle = graphite
    context.globalAlpha = 0.45
    context.lineWidth = 1.2
    context.strokeRect(
      offsetX + x * size + inset,
      offsetY + y * size + inset,
      size - inset * 2,
      size - inset * 2,
    )
    context.restore()
  },

  drawLineClear(context, theme, draw) {
    const progress = clamp01(draw.progress)
    const { cell: size, offsetX, offsetY } = draw
    const rowGroups = groupAdjacentRows(draw.rows)
    const eraserX =
      ease(clamp01(progress / 0.8)) * (BOARD_WIDTH + 1.2) * size - size * 0.6

    context.save()
    context.globalAlpha = 1
    for (const row of draw.rows) {
      const rowTop = offsetY + row * size

      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const type = draw.board[row][x]
        if (type === null) continue

        const left = offsetX + x * size
        const erased = clamp01((eraserX - left) / (size * 1.5))
        if (erased < 1) {
          drawSketchbookCell(
            context,
            theme,
            draw,
            x,
            row,
            type,
            hash(x, row),
            erased > 0 ? 1 - erased : 1,
          )
        }

        if (erased === 0) continue

        context.fillStyle = 'rgb(80 80 80)'
        context.globalAlpha = 0.12 * (1 - progress)
        context.fillRect(left, rowTop + size * 0.3, size, size * 0.4)

        context.fillStyle = 'rgb(150 110 115)'
        for (let crumb = 0; crumb < 3; crumb += 1) {
          const fall = clamp01(erased * 1.4 - hash(x, row, crumb) * 0.4)
          context.globalAlpha = 0.7 * (1 - fall)
          context.beginPath()
          context.ellipse(
            left + size * hash(x, row, crumb + 2),
            rowTop + size * (0.8 + fall * 0.9),
            size * 0.06,
            size * 0.04,
            hash(x, row, crumb + 4) * Math.PI,
            0,
            Math.PI * 2,
          )
          context.fill()
        }
        context.globalAlpha = 1
      }
    }

    for (let groupIndex = 0; groupIndex < rowGroups.length; groupIndex += 1) {
      const rows = rowGroups[groupIndex]
      const firstRow = rows[0]
      const lastRow = rows[rows.length - 1]
      const groupTop = offsetY + firstRow * size
      const groupHeight = (lastRow - firstRow + 1) * size
      const verticalSpan = Math.max(0, (groupHeight - size) / 2)
      const verticalMotion =
        verticalSpan > 0
          ? Math.sin(progress * Math.PI * 6) * verticalSpan
          : Math.sin(progress * 46 + groupIndex) * size * 0.08
      if (progress < 0.85) {
        drawEraser(
          context,
          eraserX,
          groupTop + groupHeight / 2 + verticalMotion,
          size,
        )
      }
    }
    context.restore()
  },
}

function drawSketchbookCell(
  context: CanvasRenderingContext2D,
  theme: BlockDropTheme,
  geometry: BoardGeometry,
  x: number,
  y: number,
  type: CellDraw['type'],
  seed: number,
  hatchOpacity = 1,
): void {
  if (hatchOpacity <= 0) return

  const { cell: size, offsetX, offsetY } = geometry
  const left = offsetX + x * size
  const top = offsetY + y * size
  const inset = size * 0.08
  const textureSeed = Math.floor(seed * 0x1_0000_0000)

  context.save()
  context.beginPath()
  context.rect(
    left + inset,
    top + inset,
    size - inset * 2,
    size - inset * 2,
  )
  context.clip()
  context.strokeStyle = theme.pieces[type]
  context.globalAlpha = 0.85 * hatchOpacity
  context.lineWidth = Math.max(1, size * 0.07)
  context.lineCap = 'round'
  const gap = size * 0.16
  const tilt =
    (hash(textureSeed, type.charCodeAt(0), 1) - 0.5) * size * 0.25
  for (let distance = -size; distance < size * 1.2; distance += gap) {
    context.beginPath()
    context.moveTo(left + distance, top + size)
    context.lineTo(left + distance + size + tilt, top)
    context.stroke()
  }
  context.restore()

  if (hatchOpacity < 1) return

  const x0 =
    left + inset + (hash(textureSeed, type.charCodeAt(0), 2) - 0.5) * size * 0.08
  const y0 =
    top + inset + (hash(textureSeed, type.charCodeAt(0), 3) - 0.5) * size * 0.08
  const x1 =
    left + size - inset + (hash(textureSeed, type.charCodeAt(0), 4) - 0.5) * size * 0.08
  const y1 =
    top + inset + (hash(textureSeed, type.charCodeAt(0), 5) - 0.5) * size * 0.08
  const x2 =
    left + size - inset + (hash(textureSeed, type.charCodeAt(0), 6) - 0.5) * size * 0.08
  const y2 =
    top + size - inset + (hash(textureSeed, type.charCodeAt(0), 7) - 0.5) * size * 0.08
  const x3 =
    left + inset + (hash(textureSeed, type.charCodeAt(0), 8) - 0.5) * size * 0.08
  const y3 =
    top + size - inset + (hash(textureSeed, type.charCodeAt(0), 9) - 0.5) * size * 0.08

  context.strokeStyle = graphite
  context.lineWidth = Math.max(1, size * 0.05)
  context.beginPath()
  context.moveTo(x0 - (x1 - x0) * 0.06, y0 - (y1 - y0) * 0.06)
  context.lineTo(x1 + (x1 - x0) * 0.06, y1 + (y1 - y0) * 0.06)
  context.moveTo(x1 - (x2 - x1) * 0.06, y1 - (y2 - y1) * 0.06)
  context.lineTo(x2 + (x2 - x1) * 0.06, y2 + (y2 - y1) * 0.06)
  context.moveTo(x2 - (x3 - x2) * 0.06, y2 - (y3 - y2) * 0.06)
  context.lineTo(x3 + (x3 - x2) * 0.06, y3 + (y3 - y2) * 0.06)
  context.moveTo(x3 - (x0 - x3) * 0.06, y3 - (y0 - y3) * 0.06)
  context.lineTo(x0 + (x0 - x3) * 0.06, y0 + (y0 - y3) * 0.06)
  context.stroke()
}

function drawEraser(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  context.save()
  context.translate(x, y)
  context.rotate((-8 * Math.PI) / 180)
  context.fillStyle = eraserPink
  context.fillRect(-size * 0.7, -size * 0.48, size, size * 0.96)
  context.fillStyle = eraserBlue
  context.fillRect(size * 0.3, -size * 0.48, size * 0.55, size * 0.96)
  context.strokeStyle = graphite
  context.lineWidth = 1.2
  context.strokeRect(-size * 0.7, -size * 0.48, size * 1.55, size * 0.96)
  context.restore()
}

function groupAdjacentRows(rows: ReadonlyArray<number>): number[][] {
  const sortedRows = [...new Set(rows)].sort((a, b) => a - b)
  const groups: number[][] = []

  for (const row of sortedRows) {
    const group = groups[groups.length - 1]
    if (group !== undefined && group[group.length - 1] + 1 === row) {
      group.push(row)
    } else {
      groups.push([row])
    }
  }

  return groups
}
