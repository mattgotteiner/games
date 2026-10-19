import { BOARD_HEIGHT, BOARD_WIDTH } from '../rules'
import type { BlockDropTheme } from '../themes'
import { align, clamp01, ease, hash } from './shared'
import type { BoardGeometry, CellDraw, ThemeRenderer } from './types'

const lightEmboss = 'rgb(255 240 220 / '
const darkEmboss = 'rgb(0 0 0 / '

export const chocolateRenderer: ThemeRenderer = {
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
  },

  drawCell(context, theme, cell) {
    drawChocolateCell(context, theme, cell, cell.x, cell.y, cell.type)
  },

  drawGhostCell(context, _theme, cell) {
    const { cell: size, offsetX, offsetY, x, y } = cell
    const inset = size * 0.1
    context.save()
    context.setLineDash([1.5, size * 0.12])
    context.lineCap = 'square'
    context.strokeStyle = 'rgb(227 184 102 / 60%)'
    context.lineWidth = 2
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
    const soften = clamp01(progress / 0.35)
    const melt = ease(clamp01((progress - 0.25) / 0.75))
    const fade = 1 - clamp01((progress - 0.7) / 0.3)
    const { cell: size, offsetX, offsetY } = draw

    context.save()
    context.globalAlpha = fade
    const groups = groupAdjacentRows(draw.rows)
    if (melt === 0) {
      for (const row of draw.rows) {
        for (let x = 0; x < BOARD_WIDTH; x += 1) {
          const type = draw.board[row][x]
          if (type !== null) {
            drawChocolateCell(context, theme, draw, x, row, type, soften)
          }
        }
      }
      context.restore()
      return
    }

    for (const rows of groups) {
      const topRow = rows[0]
      const bottomRow = rows[rows.length - 1]
      const rowTop = offsetY + topRow * size
      const meltBottom = offsetY + (bottomRow + 1) * size
      const topAt = (localX: number) =>
        rowTop +
        size * 0.08 +
        melt * size * 0.5 +
        Math.sin((localX / size) * 1.7 + topRow) * size * 0.1 * melt

      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const type = draw.board[topRow][x]
        if (type === null) continue

        const cellLeft = offsetX + x * size
        context.fillStyle = theme.pieces[type]
        context.beginPath()
        context.moveTo(cellLeft, topAt(x * size))
        context.lineTo(cellLeft + size, topAt((x + 1) * size))
        context.lineTo(cellLeft + size, rowTop + size)
        context.lineTo(cellLeft, rowTop + size)
        context.closePath()
        context.fill()

        for (const row of rows.slice(1)) {
          const bandType = draw.board[row][x]
          if (bandType !== null) {
            context.fillStyle = theme.pieces[bandType]
            context.fillRect(
              cellLeft,
              offsetY + row * size,
              size,
              size,
            )
          }
        }

        for (let drip = 0; drip < 2; drip += 1) {
          if (hash(x, topRow, drip) < 0.35) continue
          const dripX =
            cellLeft + size * (0.2 + hash(x, topRow, drip + 3) * 0.6)
          const dripLength =
            size * (0.6 + hash(x, topRow, drip + 6) * 1.4) * melt
          const dripWidth = size * 0.22
          context.fillRect(
            dripX - dripWidth / 2,
            meltBottom - 1,
            dripWidth,
            dripLength,
          )
          context.beginPath()
          context.arc(
            dripX,
            meltBottom + dripLength,
            dripWidth * 0.7,
            0,
            Math.PI * 2,
          )
          context.fill()
        }
      }

      context.strokeStyle = 'rgb(255 240 220 / 28%)'
      context.lineWidth = Math.max(1, size * 0.06)
      context.beginPath()
      for (let step = 0; step <= BOARD_WIDTH * 4; step += 1) {
        const localX = (size * step) / 4
        const x = offsetX + localX
        const y = topAt(localX) + size * 0.08
        if (step === 0) context.moveTo(x, y)
        else context.lineTo(x, y)
      }
      context.stroke()
    }
    context.restore()
  },
}

function drawChocolateCell(
  context: CanvasRenderingContext2D,
  theme: BlockDropTheme,
  geometry: BoardGeometry,
  x: number,
  y: number,
  type: CellDraw['type'],
  soften = 0,
): void {
  const { cell: size, offsetX, offsetY } = geometry
  const left = offsetX + x * size
  const top = offsetY + y * size
  const inset = size * 0.05

  context.fillStyle = theme.pieces[type]
  context.fillRect(
    left + inset,
    top + inset,
    size - inset * 2,
    size - inset * 2,
  )

  const emboss = 1 - soften
  if (emboss > 0) {
    const inner = size * 0.24
    context.lineWidth = Math.max(1, size * 0.07)
    context.strokeStyle = `${lightEmboss}${0.26 * emboss})`
    context.beginPath()
    context.moveTo(left + inner, top + size - inner)
    context.lineTo(left + inner, top + inner)
    context.lineTo(left + size - inner, top + inner)
    context.stroke()

    context.strokeStyle = `${darkEmboss}${0.32 * emboss})`
    context.beginPath()
    context.moveTo(left + size - inner, top + inner)
    context.lineTo(left + size - inner, top + size - inner)
    context.lineTo(left + inner, top + size - inner)
    context.stroke()
  }

  context.fillStyle = `rgb(255 255 255 / ${0.1 + soften * 0.18})`
  context.fillRect(
    left + size * 0.14,
    top + size * 0.1,
    size * 0.34,
    size * 0.08,
  )
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
