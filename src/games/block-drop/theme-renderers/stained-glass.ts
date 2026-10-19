import { BOARD_HEIGHT, BOARD_WIDTH } from '../rules'
import type { BlockDropTheme } from '../themes'
import { align, alpha, clamp01, hash, mix } from './shared'
import type { BoardGeometry, CellDraw, ThemeRenderer } from './types'

export const stainedGlassRenderer: ThemeRenderer = {
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
    drawGlassPane(context, theme, cell, cell.x, cell.y, cell.type, 0)
  },

  drawGhostCell(context, theme, cell) {
    const { cell: size, offsetX, offsetY, x, y } = cell
    const left = offsetX + x * size
    const top = offsetY + y * size
    context.fillStyle = alpha(theme.pieces[cell.type], 0.12)
    context.fillRect(left, top, size, size)
    context.strokeStyle = '#5a5a5a'
    context.lineWidth = size * 0.08
    context.strokeRect(
      left + size * 0.04,
      top + size * 0.04,
      size * 0.92,
      size * 0.92,
    )
  },

  drawLineClear(context, theme, draw) {
    const progress = clamp01(draw.progress)
    const crackProgress = clamp01(progress / 0.3)
    const shatterProgress = clamp01((progress - 0.3) / 0.7)

    context.save()
    for (const row of draw.rows) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const type = draw.board[row][x]
        if (type === null) continue

        if (progress <= 0.3) {
          drawGlassPane(
            context,
            theme,
            draw,
            x,
            row,
            type,
            crackProgress,
          )
          drawCracks(context, draw, x, row, crackProgress)
        } else {
          drawShards(context, draw, x, row, theme.pieces[type], shatterProgress)
        }
      }
    }
    context.restore()
  },
}

function drawGlassPane(
  context: CanvasRenderingContext2D,
  theme: BlockDropTheme,
  geometry: BoardGeometry,
  x: number,
  y: number,
  type: CellDraw['type'],
  glow: number,
): void {
  const { cell: size, offsetX, offsetY, ratio } = geometry
  const left = align(offsetX + x * size, ratio)
  const top = align(offsetY + y * size, ratio)
  const color = theme.pieces[type]
  const gradient = context.createLinearGradient(left, top, left + size, top + size)
  gradient.addColorStop(0, mix(color, '#ffffff', 0.32 + glow * 0.4))
  gradient.addColorStop(
    0.5,
    glow > 0 ? mix(color, '#ffffff', glow * 0.3) : color,
  )
  gradient.addColorStop(1, mix(color, '#000000', 0.28))
  context.fillStyle = gradient
  context.fillRect(left, top, size, size)

  context.strokeStyle = 'rgb(255 255 255 / 9%)'
  context.lineWidth = Math.max(1, size * 0.05)
  context.beginPath()
  context.moveTo(left + size * 0.15, top + size * (0.55 + hash(x, y) * 0.3))
  context.quadraticCurveTo(
    left + size * 0.5,
    top + size * (0.2 + hash(x, y, 2) * 0.3),
    left + size * 0.85,
    top + size * (0.45 + hash(x, y, 3) * 0.3),
  )
  context.stroke()

  context.fillStyle = 'rgb(255 255 255 / 35%)'
  context.beginPath()
  context.moveTo(left + size * 0.18, top + size * 0.18)
  context.lineTo(left + size * 0.42, top + size * 0.18)
  context.lineTo(left + size * 0.18, top + size * 0.38)
  context.fill()

  context.strokeStyle = '#161616'
  context.lineWidth = size * 0.13
  context.strokeRect(left, top, size, size)

  context.strokeStyle = 'rgb(255 255 255 / 12%)'
  context.lineWidth = 1
  context.strokeRect(
    left + size * 0.07,
    top + size * 0.07,
    size * 0.86,
    size * 0.86,
  )
}

function drawCracks(
  context: CanvasRenderingContext2D,
  geometry: BoardGeometry,
  x: number,
  y: number,
  progress: number,
): void {
  const { cell: size, offsetX, offsetY } = geometry
  const left = offsetX + x * size
  const top = offsetY + y * size
  const originX = left + size * (0.35 + hash(x, y) * 0.3)
  const originY = top + size * (0.35 + hash(x, y, 1) * 0.3)
  context.strokeStyle = `rgb(255 255 255 / ${0.85 * progress})`
  context.lineWidth = 1.2
  context.beginPath()
  drawCrackLine(
    context,
    originX,
    originY,
    left,
    top + size * hash(x, y, 4),
    progress,
  )
  drawCrackLine(
    context,
    originX,
    originY,
    left + size,
    top + size * hash(x, y, 5),
    progress,
  )
  drawCrackLine(
    context,
    originX,
    originY,
    left + size * hash(x, y, 6),
    top + size,
    progress,
  )
  context.stroke()
}

function drawCrackLine(
  context: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  edgeX: number,
  edgeY: number,
  progress: number,
): void {
  context.moveTo(originX, originY)
  context.lineTo(
    originX + (edgeX - originX) * progress,
    originY + (edgeY - originY) * progress,
  )
}

function drawShards(
  context: CanvasRenderingContext2D,
  geometry: BoardGeometry,
  x: number,
  y: number,
  color: string,
  progress: number,
): void {
  const { cell: size, offsetX, offsetY } = geometry
  const left = offsetX + x * size
  const top = offsetY + y * size
  const originX = left + size * (0.35 + hash(x, y) * 0.3)
  const originY = top + size * (0.35 + hash(x, y, 1) * 0.3)
  for (let shard = 0; shard < 4; shard += 1) {
    const ax = left + (shard === 1 || shard === 2 ? size : 0)
    const ay = top + (shard >= 2 ? size : 0)
    const next = (shard + 1) % 4
    const bx = left + (next === 1 || next === 2 ? size : 0)
    const by = top + (next >= 2 ? size : 0)
    const centerX = (originX + ax + bx) / 3
    const centerY = (originY + ay + by) / 3
    const velocityX =
      (centerX - originX) * 2.4 + (hash(x, y, shard + 7) - 0.5) * size * 1.2
    const velocityY = -size * 0.7 * hash(x, y, shard + 11)
    const translateX = centerX + velocityX * progress
    const translateY =
      centerY +
      velocityY * progress +
      0.5 * 7 * size * progress * progress
    const rotation = (hash(x, y, shard + 13) - 0.5) * 4 * progress

    context.save()
    context.globalAlpha = 1 - progress
    context.translate(translateX, translateY)
    context.rotate(rotation)
    context.beginPath()
    context.moveTo(originX - centerX, originY - centerY)
    context.lineTo(ax - centerX, ay - centerY)
    context.lineTo(bx - centerX, by - centerY)
    context.closePath()
    context.fillStyle = mix(color, '#ffffff', 0.2)
    context.fill()
    context.strokeStyle = '#161616'
    context.lineWidth = size * 0.07
    context.stroke()
    context.restore()
  }
}
