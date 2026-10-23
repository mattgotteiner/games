import { hash, ease, clamp01 } from '../block-drop/theme-renderers/shared'
import { BRICK_BURST_LOOKS, type BrickBurstLook } from './palette'
import { classicRenderer, type BrickBurstRenderer, type BrickDraw, type DrawContext } from './renderer'
import {
  applyAction, BALL_LOST_MS, BRICKS_TOP, BRICK_H, BRICK_W, COLUMNS, createGame,
  FIELD_HEIGHT, FIELD_WIDTH, LEVEL_CLEAR_MS, STEP_MS, step,
  type BrickBurstAction, type BrickBurstDifficulty, type BrickBurstEvent, type BrickBurstState,
} from './rules'

export interface BrickBurstControllerOptions {
  readonly seed?: number
  readonly difficulty?: BrickBurstDifficulty
  readonly initialState?: BrickBurstState
  readonly requestFrame?: typeof requestAnimationFrame
  readonly cancelFrame?: typeof cancelAnimationFrame
  readonly createResizeObserver?: (callback: ResizeObserverCallback) => ResizeObserver
  readonly devicePixelRatio?: () => number
  readonly reducedMotion?: () => boolean
  readonly now?: () => number
  readonly controlBar?: HTMLElement
  readonly look?: BrickBurstLook
  readonly renderer?: BrickBurstRenderer
}
export type BrickBurstStateListener = (state: BrickBurstState, events: readonly BrickBurstEvent[]) => void
export interface BrickBurstEffect {
  readonly event: Extract<BrickBurstEvent, { type: 'brick-hit' | 'paddle-hit' }>
  readonly startedAt: number
  readonly durationMs: number
}
interface Drag { id: number; startX: number; startY: number; lastX: number; startedAt: number; moved: boolean; canvas: boolean; surface: HTMLElement }
const direction = (value: number): -1 | 0 | 1 => Math.max(-1, Math.min(1, value)) as -1 | 0 | 1
const active = (s: BrickBurstState) => s.status === 'playing' || s.status === 'serving'

export class BrickBurstController {
  private state: BrickBurstState
  private readonly ctx: DrawContext
  private readonly look: BrickBurstLook
  private readonly renderer: BrickBurstRenderer
  private readonly requestFrame: typeof requestAnimationFrame
  private readonly cancelFrame: typeof cancelAnimationFrame
  private readonly devicePixelRatio: () => number
  private readonly readMotionOption?: () => boolean
  private motionReduced = false
  private dirty = true
  private readonly now: () => number
  private readonly observer: ResizeObserver
  private readonly cleanup: Array<() => void> = []
  private frame: number | null = null
  private lastFrame: number | null = null
  private accumulator = 0
  private effectTime = 0
  private levelStartedAt = 0
  private steps = 0
  private effects: BrickBurstEffect[] = []
  private trail: Array<readonly [number, number]> = []
  private readonly keys = new Set<string>()
  private readonly buttons = new Map<number, { direction: -1 | 1; surface: HTMLElement }>()
  private drag: Drag | null = null
  private lastTouchTime = -Infinity
  private destroyed = false
  private ratio = 0
  private boardWidth = FIELD_WIDTH
  private readonly actions: BrickBurstAction[] = []

  constructor(private readonly canvas: HTMLCanvasElement, private readonly container: HTMLElement,
    private readonly onState: BrickBurstStateListener, options: BrickBurstControllerOptions = {}) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Brick Burst requires Canvas 2D support')
    this.ctx = ctx as DrawContext
    this.look = options.look ?? BRICK_BURST_LOOKS.classic
    this.renderer = options.renderer ?? classicRenderer
    this.state = options.initialState ?? createGame(options.seed ?? Date.now() >>> 0, options.difficulty)
    this.levelStartedAt = this.state.status === 'serving' ? 0 : -Infinity
    this.requestFrame = options.requestFrame ?? window.requestAnimationFrame.bind(window)
    this.cancelFrame = options.cancelFrame ?? window.cancelAnimationFrame.bind(window)
    this.devicePixelRatio = options.devicePixelRatio ?? (() => window.devicePixelRatio || 1)
    this.readMotionOption = options.reducedMotion
    if (this.readMotionOption) this.motionReduced = this.readMotionOption()
    else {
      const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)')
      if (preference) {
        this.motionReduced = preference.matches
        this.listen(preference, 'change', () => {
          this.motionReduced = preference.matches
          this.dirty = true
        })
      }
    }
    this.now = options.now ?? (() => performance.now())
    this.observer = (options.createResizeObserver ?? ((cb) => new ResizeObserver(cb)))(() => this.resize())
    this.observer.observe(container)
    this.listen(window, 'keydown', this.keyDown)
    this.listen(window, 'keyup', this.keyUp)
    this.listen(window, 'blur', this.clearInput)
    this.listen(window, 'resize', this.resize)
    this.listen(document, 'visibilitychange', () => { if (document.visibilityState === 'hidden') this.dispatch({ type: 'pause' }) })
    for (const surface of [canvas, options.controlBar]) {
      if (!surface) continue
      this.listen(surface, 'pointerdown', (e) => this.pointerDown(e as PointerEvent, surface))
      this.listen(surface, 'pointermove', (e) => this.pointerMove(e as PointerEvent, surface))
      this.listen(surface, 'pointerup', (e) => this.pointerEnd(e as PointerEvent, false))
      this.listen(surface, 'pointercancel', (e) => this.pointerEnd(e as PointerEvent, true))
      this.listen(surface, 'lostpointercapture', (e) => this.pointerEnd(e as PointerEvent, true))
      this.listen(surface, 'dblclick', (e) => e.preventDefault())
    }
    this.listen(canvas, 'click', (e) => { if ((e as MouseEvent).detail && this.now() - this.lastTouchTime > 800 && !(e as PointerEvent).pointerType?.match(/touch|pen/)) this.dispatch({ type: 'serve' }) })
    if (options.controlBar) this.listen(options.controlBar, 'click', (e) => {
      const button = (e.target as Element).closest<HTMLButtonElement>('button')
      if (!button || button.disabled) return
      if (button.dataset.serve !== undefined) this.dispatch({ type: 'serve' })
      else if ((e as MouseEvent).detail === 0 && button.dataset.direction) this.dispatch({ type: 'nudge', direction: Number(button.dataset.direction) as -1 | 1 })
    })
    this.resize()
    this.onState(this.state, [])
    this.frame = this.requestFrame(this.tick)
  }
  getState(): BrickBurstState { return this.state }
  private listen(target: EventTarget, type: string, callback: EventListener): void {
    target.addEventListener(type, callback)
    this.cleanup.push(() => target.removeEventListener(type, callback))
  }
  dispatch(action: BrickBurstAction): void {
    if (this.destroyed) return
    this.actions.push(action)
    this.flushActions()
    if (this.dirty && this.frame === null) this.draw()
  }
  private flushActions(): void {
    for (const action of this.actions.splice(0)) {
      const previous = this.state
      this.state = applyAction(this.state, action)
      if (action.type === 'pause' || action.type === 'resume' || action.type === 'restart') {
        const drag = this.drag; this.drag = null
        if (drag) this.release(drag.surface, drag.id)
        this.accumulator = 0; this.lastFrame = null
      }
      if (action.type === 'restart') {
        this.effects = []; this.trail = []; this.effectTime = 0; this.levelStartedAt = 0; this.steps = 0
      }
      if (active(this.state) && !active(previous)) this.steer()
      if (this.state !== previous) this.dirty = true
      if (this.state !== previous) this.onState(this.state, action.type === 'restart' ? [{ type: 'level-started', level: 1 }] : [])
    }
  }
  private steer(): void {
    const left = this.keys.has('arrowleft') || this.keys.has('a')
    const right = this.keys.has('arrowright') || this.keys.has('d')
    let button = 0
    for (const press of this.buttons.values()) button += press.direction
    this.state = applyAction(this.state, { type: 'steer', direction: direction(Number(right) - Number(left) + direction(button)) })
  }
  private clearInput = (): void => {
    this.keys.clear()
    for (const [id, { surface }] of this.buttons) this.release(surface, id)
    this.buttons.clear()
    const drag = this.drag; this.drag = null
    if (drag) this.release(drag.surface, drag.id)
    this.state = { ...this.state, steer: 0 }
  }
  private release(surface: HTMLElement, id: number): void {
    try { if (surface.hasPointerCapture?.(id)) surface.releasePointerCapture(id) } catch { /* cancelled pointer */ }
  }
  private keyDown = (event: Event): void => {
    const e = event as KeyboardEvent, key = e.key.toLowerCase()
    const target = e.target as Element | null
    if (target?.closest?.('input, textarea, select, dialog') || (key === ' ' && target?.closest?.('button'))) return
    if (!['arrowleft', 'arrowright', 'a', 'd', 'arrowup', ' ', 'p', 'r'].includes(key)) return
    e.preventDefault()
    if (e.repeat) return
    if (['arrowleft', 'arrowright', 'a', 'd'].includes(key)) { this.keys.add(key); this.steer() }
    else if (key === 'p') this.dispatch({ type: this.state.status === 'paused' ? 'resume' : 'pause' })
    else this.dispatch({ type: key === 'r' ? 'restart' : 'serve' })
  }
  private keyUp = (event: Event): void => { this.keys.delete((event as KeyboardEvent).key.toLowerCase()); this.steer() }
  private pointerDown(e: PointerEvent, surface: HTMLElement): void {
    if (e.button !== 0) return
    const button = (e.target as Element).closest<HTMLButtonElement>('button')
    if (button) {
      if (button.disabled || !button.dataset.direction) return
      e.preventDefault()
      this.buttons.set(e.pointerId, { direction: Number(button.dataset.direction) as -1 | 1, surface: button })
      try { button.setPointerCapture(e.pointerId) } catch { /* capture unavailable */ }
      this.steer(); return
    }
    if (!active(this.state) || e.pointerType === 'mouse' || this.drag || e.isPrimary === false) return
    e.preventDefault()
    this.lastTouchTime = this.now()
    this.drag = { id: e.pointerId, startX: e.clientX, startY: e.clientY, lastX: e.clientX, startedAt: this.now(), moved: false, canvas: surface === this.canvas, surface }
    try { surface.setPointerCapture(e.pointerId) } catch { /* capture unavailable */ }
  }
  private pointerMove(e: PointerEvent, surface: HTMLElement): void {
    if (!active(this.state)) return
    if (e.pointerType === 'mouse' && surface === this.canvas && this.buttons.size === 0) {
      this.dispatch({ type: 'paddle-to', x: (e.clientX - this.canvas.getBoundingClientRect().left) * FIELD_WIDTH / this.boardWidth }); return
    }
    const drag = this.drag
    if (!drag || drag.id !== e.pointerId) return
    e.preventDefault()
    if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) >= 10) drag.moved = true
    if (!drag.moved) return
    if (!this.buttons.size) this.dispatch({ type: 'paddle-to', x: this.state.paddleX + (e.clientX - drag.lastX) * FIELD_WIDTH / this.boardWidth })
    drag.lastX = e.clientX
  }
  private pointerEnd(e: PointerEvent, cancelled: boolean): void {
    if (this.buttons.delete(e.pointerId)) this.steer()
    const drag = this.drag
    if (!drag || drag.id !== e.pointerId) return
    this.drag = null
    if (!cancelled && !drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 10 && this.now() - drag.startedAt < 300 && drag.canvas) this.dispatch({ type: 'serve' })
    this.release(drag.surface, drag.id)
  }
  private effectiveRatio(): number {
    return Math.max(1, this.devicePixelRatio())
  }
  private resize = (): void => {
    if (this.destroyed) return
    const rect = this.container.getBoundingClientRect()
    const width = Math.max(1, Math.min(rect.width || FIELD_WIDTH, (rect.height || FIELD_HEIGHT) * FIELD_WIDTH / FIELD_HEIGHT))
    const ratio = this.effectiveRatio()
    if (width === this.boardWidth && ratio === this.ratio) return
    this.boardWidth = width; this.ratio = ratio
    const height = width * FIELD_HEIGHT / FIELD_WIDTH
    this.canvas.style.width = `${width}px`; this.canvas.style.height = `${height}px`
    const surface = this.canvas.parentElement
    if (surface && surface !== this.container) { surface.style.width = `${width}px`; surface.style.height = `${height}px` }
    this.canvas.width = Math.round(width * this.ratio); this.canvas.height = Math.round(height * this.ratio)
    const scale = width / FIELD_WIDTH
    this.ctx.px = 1 / scale
    this.ctx.align = (value) => Math.round(value * this.ratio * scale) / (this.ratio * scale)
    this.draw()
  }
  private tick = (time: number): void => {
    if (this.destroyed) return
    this.frame = null
    const reduced = this.readMotionOption?.() ?? this.motionReduced
    if (reduced !== this.motionReduced) { this.motionReduced = reduced; this.dirty = true }
    if (this.effectiveRatio() !== this.ratio) this.resize()
    const dt = this.lastFrame === null ? 0 : Math.max(0, Math.min(100, time - this.lastFrame))
    this.lastFrame = time
    this.flushActions()
    const before = this.state
    const events: BrickBurstEvent[] = []
    if (this.state.status !== 'paused' && this.state.status !== 'over') {
      this.accumulator += dt
      while (this.accumulator + 1e-8 >= STEP_MS) {
        this.accumulator -= STEP_MS
        const previous = this.state
        const result = step(previous); this.state = result.state; events.push(...result.events)
        if (active(this.state) && !active(previous)) this.steer()
        if (this.state !== previous) this.dirty = true
        this.effectTime += STEP_MS
        this.processEvents(result.events)
        if (++this.steps % 4 === 0 && this.state.status === 'playing' && !this.motionReduced) {
          this.trail.unshift([this.state.ball.x, this.state.ball.y]); this.trail.length = Math.min(6, this.trail.length)
        }
      }
    } else this.accumulator = 0
    if (events.length || before.status !== this.state.status || before.level !== this.state.level || before.score !== this.state.score) this.onState(this.state, events)
    if (this.motionReduced) { this.effects = []; this.trail = [] }
    this.effects = this.effects.filter((effect) => this.effectTime - effect.startedAt < effect.durationMs)
    if (this.dirty) this.draw()
    this.frame = this.requestFrame(this.tick)
  }
  private processEvents(events: readonly BrickBurstEvent[]): void {
    for (const event of events) {
      if (event.type === 'ball-lost' || event.type === 'level-started') this.trail = []
      if (event.type === 'level-started') this.levelStartedAt = this.effectTime
      if (!this.motionReduced && (event.type === 'brick-hit' || event.type === 'paddle-hit')) {
        this.effects.push({ event, startedAt: this.effectTime, durationMs: event.type === 'brick-hit' && event.broken ? 240 : 120 })
      }
    }
  }
  /** Also used by the browser performance check; this method never advances rules. */
  draw(): void {
    const ctx = this.ctx, s = this.state, look = this.look, renderer = this.renderer
    const scale = this.canvas.width / FIELD_WIDTH
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, FIELD_WIDTH, FIELD_HEIGHT); ctx.clip()
    renderer.drawBackground(ctx, look)
    const reduced = this.motionReduced
    const brick: BrickDraw = { row: 0, col: 0, kind: 'normal', damaged: false, seed: 0 }
    const options = { alpha: 1, dy: 0 }
    for (let i = 0; i < s.bricks.length; i++) {
      const b = s.bricks[i]; if (!b) continue
      brick.row = Math.floor(i / COLUMNS); brick.col = i % COLUMNS; brick.kind = b.kind; brick.damaged = b.damaged; brick.seed = hash(brick.col, brick.row)
      const p = reduced ? 1 : clamp01((this.effectTime - this.levelStartedAt - 30 * brick.row) / 160)
      options.alpha = p; options.dy = reduced ? 0 : -6 * (1 - ease(p))
      renderer.drawBrick(ctx, look, brick, options)
    }
    if (!reduced) for (const effect of this.effects) {
      const e = effect.event, p = clamp01((this.effectTime - effect.startedAt) / effect.durationMs)
      if (e.type !== 'brick-hit') continue
      if (e.broken) renderer.drawBrickPop(ctx, look, e, [e.impactX, e.impactY], e.ballVx, p)
      else {
        ctx.strokeStyle = `rgb(255 255 255 / ${0.8 * (1 - p)})`; ctx.lineWidth = 2.4
        ctx.strokeRect(e.col * BRICK_W + 2.2, BRICKS_TOP + e.row * BRICK_H + 2.2, BRICK_W - 4.4, BRICK_H - 4.4)
      }
    }
    const status = s.status === 'paused' ? s.resumeStatus : s.status
    const lost = status === 'ball-lost', cleared = status === 'level-clear'
    const lostProgress = 1 - s.feedbackMs / BALL_LOST_MS, clearProgress = 1 - s.feedbackMs / LEVEL_CLEAR_MS
    let paddleEffect: BrickBurstEffect | undefined
    if (!reduced) for (let i = this.effects.length - 1; i >= 0; i--) {
      if (this.effects[i].event.type === 'paddle-hit') { paddleEffect = this.effects[i]; break }
    }
    const paddleOptions = { alpha: lost ? reduced ? 0.4 : 1 - 0.6 * Math.sin(lostProgress * Math.PI) : 1,
      flash: paddleEffect ? clamp01((this.effectTime - paddleEffect.startedAt) / 120) : undefined,
      contactX: paddleEffect?.event.type === 'paddle-hit' ? paddleEffect.event.x : undefined }
    const paddleX = cleared && !reduced && clearProgress > 0.6 ? s.paddleX + (FIELD_WIDTH / 2 - s.paddleX) * ease((clearProgress - 0.6) / 0.4) : s.paddleX
    renderer.drawPaddle(ctx, look, paddleX, paddleOptions)
    if (!lost && !cleared && status !== 'over') renderer.drawBall(ctx, look, s.ball.x, s.ball.y, reduced || status !== 'playing' ? [] : this.trail)
    if (status === 'serving') renderer.drawServeGuide(ctx, look, s.ball.x, s.ball.y, s.serveAngle)
    if (lost && !reduced) renderer.drawBallLost(ctx, look, lostProgress)
    if (cleared && !reduced) renderer.drawLevelSweep(ctx, look, clearProgress)
    if (s.status === 'paused' || s.status === 'over') { ctx.fillStyle = s.status === 'paused' ? look.board.pausedVeil : look.board.gameOverVeil; ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT) }
    ctx.restore()
    this.dirty = false
  }
  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    if (this.frame !== null) this.cancelFrame(this.frame)
    this.frame = null; this.clearInput(); this.actions.length = 0; this.effects = []; this.trail = []
    this.cleanup.forEach((remove) => remove()); this.cleanup.length = 0; this.observer.disconnect()
  }
}
