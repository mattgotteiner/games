import { BOARD_HEIGHT, BOARD_WIDTH } from '../rules'
import type { BlockDropTheme } from '../themes'
import { align, alpha, clamp01, hash, mix } from './shared'
import type { BoardGeometry, CellDraw, ThemeRenderer } from './types'

export const natureRenderer: ThemeRenderer = {
  drawBackground(context, theme, geometry) {
    const { offsetX, offsetY, width, height, cell, ratio } = geometry
    const background = context.createLinearGradient(
      0,
      offsetY,
      0,
      offsetY + height,
    )
    background.addColorStop(0, '#1b2117')
    background.addColorStop(1, '#2a3122')
    context.fillStyle = background
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
    drawNatureStone(context, theme, cell, cell.x, cell.y, cell.type)
  },

  drawGhostCell(context, theme, cell) {
    const { cell: size, offsetX, offsetY, ratio, x, y, type } = cell
    const left = align(offsetX + x * size, ratio)
    const top = align(offsetY + y * size, ratio)
    const alignedSize = align(size, ratio)
    const inset = align(size * 0.12, ratio)

    context.save()
    context.setLineDash([size * 0.14, size * 0.1])
    context.strokeStyle = alpha(theme.pieces[type], 0.5)
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
    const progress = clamp01(draw.progress)
    const transform = clamp01(progress / 0.3)
    const driftProgress = clamp01((progress - 0.15) / 0.85)
    const drift = driftProgress * driftProgress * (3 - 2 * driftProgress)
    const { cell: size, offsetX, offsetY } = draw

    context.save()
    for (const row of draw.rows) {
      context.fillStyle = `rgb(168 198 134 / ${0.22 * (1 - progress)})`
      context.fillRect(offsetX, offsetY + row * size, draw.width, size)

      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const type = draw.board[row][x]
        if (type === null) continue

        if (transform < 1) {
          context.save()
          context.globalAlpha = 1 - transform
          drawNatureStone(context, theme, draw, x, row, type)
          context.restore()
        }

        const sway =
          Math.sin(drift * Math.PI * 2 + hash(x, row) * 6) *
          size *
          0.35 *
          drift
        const fall = size * 1.8 * Math.pow(drift, 1.4)
        const rotation =
          (hash(x, row, 2) - 0.5) * 0.6 +
          (hash(x, row, 3) - 0.5) * 2.4 * drift
        const leafLength = size * (0.46 - 0.12 * drift)
        const leafOpacity = transform * (1 - drift * drift)

        if (leafOpacity <= 0) continue
        context.save()
        context.translate(
          offsetX + (x + 0.5) * size + sway,
          offsetY + (row + 0.5) * size + fall,
        )
        context.rotate(rotation)
        context.globalAlpha = leafOpacity
        context.fillStyle = theme.pieces[type]
        context.beginPath()
        context.moveTo(-leafLength, 0)
        context.quadraticCurveTo(0, -leafLength * 0.75, leafLength, 0)
        context.quadraticCurveTo(0, leafLength * 0.75, -leafLength, 0)
        context.fill()

        context.strokeStyle = 'rgb(0 0 0 / 22%)'
        context.lineWidth = 1
        context.beginPath()
        context.moveTo(-leafLength * 0.8, 0)
        context.lineTo(leafLength * 0.9, 0)
        context.stroke()
        context.restore()
      }
    }
    context.restore()
  },
}

function drawNatureStone(
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
  const inset = size * 0.06
  const gradient = context.createRadialGradient(
    left + size * 0.35,
    top + size * 0.3,
    size * 0.05,
    left + size / 2,
    top + size / 2,
    size * 0.65,
  )
  gradient.addColorStop(0, mix(theme.pieces[type], '#ffffff', 0.28))
  gradient.addColorStop(0.55, theme.pieces[type])
  gradient.addColorStop(1, mix(theme.pieces[type], '#000000', 0.2))
  context.fillStyle = gradient
  context.fillRect(
    left + inset,
    top + inset,
    size - inset * 2,
    size - inset * 2,
  )

  context.fillStyle = 'rgb(0 0 0 / 14%)'
  for (let speckle = 0; speckle < 2; speckle += 1) {
    context.beginPath()
    context.arc(
      left + size * (0.3 + hash(x, y, speckle) * 0.4),
      top + size * (0.4 + hash(x, y, speckle + 5) * 0.35),
      size * 0.035,
      0,
      Math.PI * 2,
    )
    context.fill()
  }
}
