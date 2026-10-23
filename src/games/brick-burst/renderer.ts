import { alpha, mix, hash, ease, clamp01, roundRect } from '../block-drop/theme-renderers/shared'
import type { BrickBurstLook } from './palette'
import type { BrickKind } from './rules'
import { FIELD_WIDTH as FW, FIELD_HEIGHT as FH, BRICK_W as BW, BRICK_H as BH, BRICKS_TOP as TOP, PADDLE_W as PW, PADDLE_H as PH, PADDLE_TOP as PTOP, BALL_R as R } from './rules'

export type DrawContext = CanvasRenderingContext2D & { px: number; align: (value: number) => number }
export interface BrickDraw { row: number; col: number; kind: BrickKind; damaged?: boolean; seed?: number }
interface BrickOptions { alpha?: number; dy?: number; scale?: number; crackFlash?: number; flash?: number }
interface PaddleOptions { alpha?: number; flash?: number; contactX?: number }
function drawBackground(ctx: DrawContext, look: BrickBurstLook) {
  const px = ctx.px
  ctx.fillStyle = look.board.field; ctx.fillRect(0, 0, FW, FH)
  const g = ctx.createRadialGradient(192, 172, 0, 192, 172, 400)
  g.addColorStop(0, look.board.glow); g.addColorStop(1, look.board.field)
  ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH)
  ctx.strokeStyle = look.board.grid; ctx.lineWidth = px; ctx.beginPath()
  for (let x = 32; x < FW; x += 32) { ctx.moveTo(ctx.align(x), 0); ctx.lineTo(ctx.align(x), FH) }
  for (let y = 32; y < FH; y += 32) { ctx.moveTo(0, ctx.align(y)); ctx.lineTo(FW, ctx.align(y)) }
  ctx.stroke()
  const d = ctx.createLinearGradient(0, FH - 28, 0, FH)
  d.addColorStop(0, 'rgb(251 113 133 / 0)'); d.addColorStop(1, look.board.danger)
  ctx.fillStyle = d; ctx.fillRect(0, FH - 28, FW, 28)
}

function bevel(ctx: DrawContext, x: number, y: number, w: number, h: number) {
  const e = Math.max(ctx.px, 1.6)
  ctx.fillStyle = 'rgb(255 255 255 / 28%)'; ctx.fillRect(x, y, w, e); ctx.fillRect(x, y, e, h)
  ctx.fillStyle = 'rgb(0 0 0 / 22%)'; ctx.fillRect(x, y + h - e, w, e); ctx.fillRect(x + w - e, y, e, h)
  return e
}

function crackPath(ctx: DrawContext, look: BrickBurstLook, b: BrickDraw, x: number, y: number) {
  const { row, col } = b
  const ox = x + 16 + (hash(col, row, 1) - 0.5) * 8, oy = y + 8 + (hash(col, row, 2) - 0.5) * 4
  ctx.strokeStyle = look.crack; ctx.lineWidth = ctx.px; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath()
  for (let k = 0; k < 3; k++) {
    const ex = k === 0 ? x + 6 + hash(col,row,3)*20 : k === 1 ? x + 6 + hash(col,row,4)*20 : ox < x+16 ? x+5 : x+27
    const ey = k === 0 ? y+1 : k === 1 ? y+15 : oy + (hash(col,row,9)-0.5)*4
    const mx=(ox+ex)/2, my=(oy+ey)/2, len=Math.hypot(ex-ox,ey-oy)||1, off=(hash(col,row,5+k)-0.5)*3
    ctx.moveTo(ox,oy); ctx.lineTo(mx-((ey-oy)/len)*off,my+((ex-ox)/len)*off); ctx.lineTo(ex,ey)
  }
  ctx.stroke()
}

function drawBrick(ctx: DrawContext, look: BrickBurstLook, b: BrickDraw, opt: BrickOptions = {}) {
  const color = look.bricks[b.row]
  const x = b.col * BW, y = TOP + b.row * BH, ix = x + 1, iy = y + 1, w = BW - 2, h = BH - 2
  ctx.save()
  if (opt.alpha !== undefined) ctx.globalAlpha = opt.alpha
  if (opt.dy) ctx.translate(0, opt.dy)
  if (opt.scale && opt.scale !== 1) { ctx.translate(x + BW / 2, y + BH / 2); ctx.scale(opt.scale, opt.scale); ctx.translate(-(x + BW / 2), -(y + BH / 2)) }
  if (b.kind === 'normal') {
    ctx.fillStyle = color; ctx.fillRect(ix, iy, w, h)
    const e = bevel(ctx, ix, iy, w, h)
    ctx.strokeStyle = 'rgb(255 255 255 / 18%)'; ctx.lineWidth = ctx.px
    ctx.beginPath(); ctx.moveTo(x + 4, iy + e + 1.2); ctx.lineTo(x + 14, iy + e + 1.2); ctx.stroke()
  } else {
    ctx.fillStyle = mix(color, look.board.field, 0.45); ctx.fillRect(ix, iy, w, h)
    ctx.strokeStyle = b.damaged ? alpha(color, 0.6) : color; ctx.lineWidth = 2.4
    ctx.strokeRect(ix + 1.2, iy + 1.2, w - 2.4, h - 2.4)
    bevel(ctx, ix, iy, w, h)
    ctx.fillStyle = look.rivet
    ctx.beginPath(); ctx.arc(x + 6, y + 8, 1.6, 0, Math.PI * 2); ctx.fill()
    if (!b.damaged) { ctx.beginPath(); ctx.arc(x + 26, y + 8, 1.6, 0, Math.PI * 2); ctx.fill() }
    if (b.damaged) crackPath(ctx, look, b, x, y)
    if (opt.crackFlash) { ctx.strokeStyle = `rgb(255 255 255 / ${0.8 * (1 - opt.crackFlash)})`; ctx.lineWidth = 2.4; ctx.strokeRect(ix + 1.2, iy + 1.2, w - 2.4, h - 2.4) }
  }
  if (opt.flash) { ctx.fillStyle = `rgb(255 255 255 / ${opt.flash})`; ctx.fillRect(ix, iy, w, h) }
  ctx.restore()
}

function drawPaddle(ctx: DrawContext, look: BrickBurstLook, cx: number, opt: PaddleOptions = {}) {
  const x = cx - PW / 2, px = ctx.px
  ctx.save(); ctx.globalAlpha = opt.alpha ?? 1
  const g = ctx.createLinearGradient(0, PTOP, 0, PTOP + PH)
  g.addColorStop(0, look.paddle.top); g.addColorStop(0.5, look.paddle.mid); g.addColorStop(1, look.paddle.bottom)
  roundRect(ctx, x, PTOP, PW, PH, PH / 2); ctx.fillStyle = g; ctx.fill()
  ctx.strokeStyle = 'rgb(255 255 255 / 70%)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(x + 6, PTOP + 2.2); ctx.lineTo(x + PW - 6, PTOP + 2.2); ctx.stroke()
  ctx.strokeStyle = look.paddle.grip; ctx.lineWidth = px; ctx.lineCap = 'butt'
  ctx.beginPath(); for (const dx of [-3, 3]) { ctx.moveTo(cx + dx, PTOP + 3.5); ctx.lineTo(cx + dx, PTOP + 7.5) } ctx.stroke()
  roundRect(ctx, x, PTOP, PW, PH, PH / 2); ctx.strokeStyle = look.paddle.outline; ctx.lineWidth = px; ctx.stroke()
  if (opt.flash !== undefined) {
    roundRect(ctx, x, PTOP, PW, PH, PH / 2); ctx.fillStyle = `rgb(255 255 255 / ${0.45 * (1 - opt.flash)})`; ctx.fill()
    ctx.strokeStyle = alpha(look.paddle.top, 0.5 * (1 - opt.flash)); ctx.lineWidth = px
    ctx.beginPath(); ctx.arc(opt.contactX ?? cx, PTOP - 1, 3 + 7 * opt.flash, Math.PI, 0); ctx.stroke()
  }
  ctx.restore()
}

function drawBall(ctx: DrawContext, look: BrickBurstLook, x: number, y: number, trail: ReadonlyArray<readonly [number, number]> = []) {
  trail.forEach(([tx, ty], i) => { ctx.fillStyle = alpha(look.ball.trail, 0.30 - i * 0.045); ctx.beginPath(); ctx.arc(tx, ty, R * (0.85 - i * 0.12), 0, Math.PI * 2); ctx.fill() })
  ctx.strokeStyle = look.ball.halo; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 6.5, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = look.ball.body; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x - 1.6, y - 1.6, 1.4, 0, Math.PI * 2); ctx.fill()
}

function drawServeGuide(ctx: DrawContext, look: BrickBurstLook, x: number, y: number, angle: number) {
  const dx = Math.sin(angle), dy = -Math.cos(angle)
  for (let i = 0; i < 7; i++) {
    const d = 12 + i * 10
    ctx.fillStyle = alpha(look.ball.guide, 0.75 - (0.6 * i) / 6)
    ctx.beginPath(); ctx.arc(x + dx * d, y + dy * d, 1.4, 0, Math.PI * 2); ctx.fill()
  }
}

// Brick pop "Burst": b = broken brick, impact = ball position at hit, p in [0,1]
function drawBrickPop(ctx: DrawContext, look: BrickBurstLook, b: BrickDraw, impact: readonly [number, number], ballVx: number, p: number) {
  const x = b.col * BW, y = TOP + b.row * BH, color = look.bricks[b.row], px = ctx.px
  if (p < 0.2) { const t = p / 0.2; drawBrick(ctx, look, b, { flash: 0.85 * t, scale: 1 + 0.06 * t }) }
  if (p < 0.5) {
    const t = p / 0.5, grow = 4 * ease(t)
    ctx.strokeStyle = `rgb(255 255 255 / ${0.5 * (1 - t)})`; ctx.lineWidth = px
    ctx.strokeRect(x + 1 - grow, y + 1 - grow, BW - 2 + grow * 2, BH - 2 + grow * 2)
  }
  if (p < 0.2) return
  const q = clamp01((p - 0.2) / 0.8), fw = (BW - 2) / 3, fh = (BH - 2) / 2
  const fill = b.kind === 'tough' ? mix(mix(color, look.board.field, 0.45), '#ffffff', 0.15) : mix(color, '#ffffff', 0.15)
  for (let k = 0; k < 6; k++) {
    const cx = x + 1 + (k % 3) * fw + fw / 2, cy = y + 1 + Math.floor(k / 3) * fh + fh / 2
    let ddx = cx - impact[0], ddy = cy - impact[1]; const l = Math.hypot(ddx, ddy) || 1; ddx /= l; ddy /= l
    const dx = ddx * 14 * ease(q) + Math.sign(ballVx || 1) * 6 * q + (hash(b.col, b.row, k) - 0.5) * 8 * q
    const dy = ddy * 10 * ease(q) + 26 * q * q - 6 * hash(b.col, b.row, k + 6) * q
    ctx.save(); ctx.globalAlpha = 1 - q; ctx.translate(cx + dx, cy + dy)
    ctx.rotate((hash(b.col, b.row, k + 12) - 0.5) * 2.4 * q); ctx.scale(1 - 0.35 * q, 1 - 0.35 * q)
    ctx.fillStyle = b.kind === 'tough' && k === 0 ? color : fill; ctx.fillRect(-fw / 2, -fh / 2, fw, fh)
    ctx.restore()
  }
}

function drawBallLost(ctx: DrawContext, _look: BrickBurstLook, p: number) {
  const g = ctx.createLinearGradient(0, FH - 80, 0, FH)
  g.addColorStop(0, 'rgb(251 113 133 / 0)'); g.addColorStop(1, `rgb(251 113 133 / ${0.35 * Math.sin(p * Math.PI)})`)
  ctx.fillStyle = g; ctx.fillRect(0, FH - 80, FW, 80)
}

function drawLevelSweep(ctx: DrawContext, _look: BrickBurstLook, p: number) {
  const t = clamp01(p / 0.6); if (t >= 1) return
  const y = -48 + t * (FH + 48)
  const g = ctx.createLinearGradient(0, y, 0, y + 48)
  g.addColorStop(0, 'rgb(165 243 252 / 0)'); g.addColorStop(0.5, 'rgb(165 243 252 / 28%)'); g.addColorStop(1, 'rgb(165 243 252 / 0)')
  ctx.fillStyle = g; ctx.fillRect(0, y, FW, 48)
}


export const classicRenderer = { drawBackground, drawBrick, drawPaddle, drawBall, drawServeGuide, drawBrickPop, drawBallLost, drawLevelSweep }
export type BrickBurstRenderer = typeof classicRenderer
