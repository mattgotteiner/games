import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  applyActionWithEvents,
  createGame,
  getLandingPiece,
  getPieceCells,
  stepGravityWithEvents,
  type BlockDropState,
  type GameAction,
  type LineClearEvent,
  type Tetromino,
} from './rules'
import { TETROMINO_COLORS } from './piece-metadata'

const GRAVITY_MS = 700
const MAX_FRAME_MS = GRAVITY_MS * 2
const LINE_CLEAR_MS = 180

export const KEY_ACTIONS: Readonly<Record<string, GameAction>> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'rotate',
  ArrowDown: 'soft-drop',
  ' ': 'hard-drop',
  p: 'pause',
  P: 'pause',
  r: 'restart',
  R: 'restart',
}

export interface BlockDropControllerOptions {
  readonly seed?: number
  readonly initialState?: BlockDropState
  readonly requestFrame?: typeof requestAnimationFrame
  readonly cancelFrame?: typeof cancelAnimationFrame
  readonly createResizeObserver?: (
    callback: ResizeObserverCallback,
  ) => ResizeObserver
  readonly devicePixelRatio?: () => number
  readonly reducedMotion?: () => boolean
}

export interface BlockDropPresentationState {
  readonly clearing: boolean
  readonly clearedLines?: number
  readonly locked?: boolean
  readonly action?: GameAction
}

export type BlockDropStateListener = (
  state: BlockDropState,
  presentation?: BlockDropPresentationState,
) => void

interface LineClearEffect {
  readonly event: LineClearEvent
  startedAt: number | null
  progress: number
}

export class BlockDropController {
  private state: BlockDropState
  private frameId: number | null = null
  private previousTime: number | null = null
  private elapsed = 0
  private destroyed = false
  private pixelRatio = 1
  private lineClearEffect: LineClearEffect | null = null
  private readonly context: CanvasRenderingContext2D
  private readonly requestFrame: typeof requestAnimationFrame
  private readonly cancelFrame: typeof cancelAnimationFrame
  private readonly observer: ResizeObserver
  private readonly devicePixelRatio: () => number
  private readonly reducedMotion: () => boolean

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly container: HTMLElement,
    private readonly onStateChange: BlockDropStateListener,
    options: BlockDropControllerOptions = {},
  ) {
    const context = canvas.getContext('2d')
    if (context === null) {
      throw new Error('Block Drop requires Canvas 2D support')
    }

    this.context = context
    this.state =
      options.initialState ?? createGame(options.seed ?? (Date.now() >>> 0))
    this.requestFrame =
      options.requestFrame ?? window.requestAnimationFrame.bind(window)
    this.cancelFrame =
      options.cancelFrame ?? window.cancelAnimationFrame.bind(window)
    this.devicePixelRatio =
      options.devicePixelRatio ?? (() => window.devicePixelRatio || 1)
    this.reducedMotion =
      options.reducedMotion ??
      (() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const createObserver =
      options.createResizeObserver ??
      ((callback: ResizeObserverCallback) => new ResizeObserver(callback))
    this.observer = createObserver(() => this.resize())

    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('resize', this.handleResize)
    this.observer.observe(container)
    this.resize()
    this.frameId = this.requestFrame(this.tick)
  }

  getState(): BlockDropState {
    return this.state
  }

  dispatch(action: GameAction): void {
    if (this.destroyed) return
    if (
      this.lineClearEffect !== null &&
      action !== 'restart' &&
      action !== 'pause'
    ) {
      return
    }

    const previousBoard = this.state.board
    const result = applyActionWithEvents(this.state, action)
    this.state = result.state
    const locked = action !== 'restart' && result.state.board !== previousBoard
    if (action === 'restart') {
      this.cancelLineClear()
    }
    if (action === 'restart' || action === 'pause' || result.lineClear) {
      this.elapsed = 0
      this.previousTime = null
    }
    if (result.lineClear && !this.reducedMotion()) {
      this.startLineClear(result.lineClear)
    }
    const announcedAction = action === 'restart' ? action : undefined
    this.publish(result.lineClear, announcedAction, locked)
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    if (this.frameId !== null) {
      this.cancelFrame(this.frameId)
      this.frameId = null
    }
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('resize', this.handleResize)
    this.observer.disconnect()
    this.cancelLineClear()
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const action = KEY_ACTIONS[event.key]
    if (action === undefined) return
    const target = event.target
    if (
      target instanceof Element &&
      target.closest('dialog[open]') !== null
    ) {
      return
    }
    if (
      action !== 'pause' &&
      action !== 'restart' &&
      target instanceof Element &&
      target.closest(
        'button, input, select, textarea, a[href], [contenteditable="true"]',
      ) !== null
    ) {
      return
    }
    event.preventDefault()
    this.dispatch(action)
  }

  private readonly handleResize = (): void => this.resize()

  private readonly tick = (time: number): void => {
    if (this.destroyed) return

    if (Math.max(1, this.devicePixelRatio()) !== this.pixelRatio) {
      this.resize()
    }
    if (this.lineClearEffect !== null) {
      this.advanceLineClear(time)
    } else if (this.previousTime !== null && this.state.status === 'playing') {
      this.elapsed += Math.min(Math.max(time - this.previousTime, 0), MAX_FRAME_MS)
      let changed = false
      let steps = 0
      let lineClear: LineClearEvent | undefined
      let locked = false
      while (this.elapsed >= GRAVITY_MS && steps < 2) {
        const result = stepGravityWithEvents(this.state)
        locked ||= result.state.board !== this.state.board
        this.state = result.state
        this.elapsed -= GRAVITY_MS
        changed = true
        steps += 1
        if (result.lineClear) {
          lineClear = result.lineClear
          this.elapsed = 0
          if (!this.reducedMotion()) {
            this.startLineClear(result.lineClear)
          }
          break
        }
      }
      if (changed) this.publish(lineClear, undefined, locked)
    }
    this.previousTime = time
    this.frameId = this.requestFrame(this.tick)
  }

  private resize(): void {
    const bounds = this.container.getBoundingClientRect()
    const availableWidth = Math.max(1, bounds.width)
    const containerHeight =
      bounds.height > 1 ? bounds.height : availableWidth * 2
    const viewportHeight = Math.max(
      1,
      window.innerHeight - Math.max(0, bounds.top) - 8,
    )
    const availableHeight = Math.min(containerHeight, viewportHeight)
    const cssHeight = Math.max(1, Math.min(availableHeight, availableWidth * 2))
    const cssWidth = cssHeight / 2
    const ratio = Math.max(1, this.devicePixelRatio())
    this.pixelRatio = ratio

    this.canvas.style.width = `${cssWidth}px`
    this.canvas.style.height = `${cssHeight}px`
    this.canvas.width = Math.round(cssWidth * ratio)
    this.canvas.height = Math.round(cssHeight * ratio)
    this.draw(cssWidth, cssHeight, ratio)
  }

  private publish(
    lineClear?: LineClearEvent,
    action?: GameAction,
    locked = false,
  ): void {
    this.draw(
      this.canvas.width / this.pixelRatio,
      this.canvas.height / this.pixelRatio,
      this.pixelRatio,
    )
    this.onStateChange(this.state, {
      clearing: this.lineClearEffect !== null,
      ...(lineClear ? { clearedLines: lineClear.rows.length } : {}),
      ...(locked ? { locked: true } : {}),
      ...(action ? { action } : {}),
    })
  }

  private draw(width: number, height: number, ratio: number): void {
    const cell = Math.min(width / BOARD_WIDTH, height / BOARD_HEIGHT)
    const boardWidth = cell * BOARD_WIDTH
    const boardHeight = cell * BOARD_HEIGHT
    const offsetX = (width - boardWidth) / 2
    const offsetY = (height - boardHeight) / 2
    const context = this.context

    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, width, height)
    context.fillStyle = '#07111f'
    context.fillRect(offsetX, offsetY, boardWidth, boardHeight)

    context.strokeStyle = 'rgb(148 163 184 / 18%)'
    context.lineWidth = 1
    context.beginPath()
    for (let x = 0; x <= BOARD_WIDTH; x += 1) {
      context.moveTo(offsetX + x * cell, offsetY)
      context.lineTo(offsetX + x * cell, offsetY + boardHeight)
    }
    for (let y = 0; y <= BOARD_HEIGHT; y += 1) {
      context.moveTo(offsetX, offsetY + y * cell)
      context.lineTo(offsetX + boardWidth, offsetY + y * cell)
    }
    context.stroke()

    const board = this.lineClearEffect?.event.board ?? this.state.board
    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const locked = board[y][x]
        if (locked !== null) {
          this.drawCell(x, y, locked, cell, offsetX, offsetY, ratio)
        }
      }
    }

    if (
      this.lineClearEffect === null &&
      this.state.status !== 'game-over' &&
      this.state.active !== null
    ) {
      const landing = getLandingPiece(this.state)
      if (landing !== null && landing.y !== this.state.active.y) {
        for (const { x, y } of getPieceCells(landing)) {
          this.drawGhostCell(
            x,
            y,
            landing.type,
            cell,
            offsetX,
            offsetY,
            ratio,
          )
        }
      }
      for (const { x, y } of getPieceCells(this.state.active)) {
        this.drawCell(
          x,
          y,
          this.state.active.type,
          cell,
          offsetX,
          offsetY,
          ratio,
        )
      }
    }

    if (this.lineClearEffect !== null) {
      const intensity = 0.3 + Math.sin(this.lineClearEffect.progress * Math.PI) * 0.7
      context.fillStyle = `rgb(248 250 252 / ${intensity})`
      for (const row of this.lineClearEffect.event.rows) {
        context.fillRect(offsetX, offsetY + row * cell, boardWidth, cell)
      }
    }

    if (this.state.status === 'paused') {
      context.fillStyle = 'rgb(7 17 31 / 84%)'
      context.fillRect(offsetX, offsetY, boardWidth, boardHeight)
    } else if (this.state.status === 'game-over') {
      context.fillStyle = 'rgb(7 17 31 / 76%)'
      context.fillRect(offsetX, offsetY, boardWidth, boardHeight)
    }
  }

  private drawCell(
    x: number,
    y: number,
    type: Tetromino,
    size: number,
    offsetX: number,
    offsetY: number,
    ratio: number,
  ): void {
    const align = (value: number) => Math.round(value * ratio) / ratio
    const left = align(offsetX + x * size)
    const top = align(offsetY + y * size)
    const right = align(offsetX + (x + 1) * size)
    const bottom = align(offsetY + (y + 1) * size)
    const edge = Math.max(1 / ratio, Math.round(size * 0.08 * ratio) / ratio)
    const innerLeft = align(left + edge)
    const innerTop = align(top + edge)
    const innerRight = align(right - edge)
    const innerBottom = align(bottom - edge)

    this.context.fillStyle = TETROMINO_COLORS[type]
    this.context.fillRect(
      innerLeft,
      innerTop,
      innerRight - innerLeft,
      innerBottom - innerTop,
    )
    this.context.fillStyle = 'rgb(255 255 255 / 28%)'
    this.context.fillRect(
      innerLeft,
      innerTop,
      innerRight - innerLeft,
      edge,
    )
    this.context.fillRect(
      innerLeft,
      innerTop,
      edge,
      innerBottom - innerTop,
    )
    this.context.fillStyle = 'rgb(0 0 0 / 22%)'
    this.context.fillRect(
      innerLeft,
      innerBottom - edge,
      innerRight - innerLeft,
      edge,
    )
    this.context.fillRect(
      innerRight - edge,
      innerTop,
      edge,
      innerBottom - innerTop,
    )
  }

  private drawGhostCell(
    x: number,
    y: number,
    type: Tetromino,
    size: number,
    offsetX: number,
    offsetY: number,
    ratio: number,
  ): void {
    const align = (value: number) => Math.round(value * ratio) / ratio
    const left = align(offsetX + x * size)
    const top = align(offsetY + y * size)
    const right = align(offsetX + (x + 1) * size)
    const bottom = align(offsetY + (y + 1) * size)
    const inset = Math.max(2 / ratio, Math.round(size * 0.12 * ratio) / ratio)
    const innerLeft = align(left + inset)
    const innerTop = align(top + inset)
    const innerRight = align(right - inset)
    const innerBottom = align(bottom - inset)
    const color = TETROMINO_COLORS[type]

    this.context.fillStyle = `${color}14`
    this.context.fillRect(
      innerLeft,
      innerTop,
      innerRight - innerLeft,
      innerBottom - innerTop,
    )
    this.context.strokeStyle = `${color}73`
    this.context.lineWidth = 2
    this.context.strokeRect(
      innerLeft + 1 / ratio,
      innerTop + 1 / ratio,
      innerRight - innerLeft - 2 / ratio,
      innerBottom - innerTop - 2 / ratio,
    )
  }

  private startLineClear(event: LineClearEvent): void {
    this.lineClearEffect = {
      event,
      startedAt: null,
      progress: 0,
    }
    this.canvas.dataset.clearingRows = event.rows.join(',')
  }

  private advanceLineClear(time: number): void {
    const effect = this.lineClearEffect
    if (effect === null) return
    effect.startedAt ??= time
    effect.progress = Math.min(1, (time - effect.startedAt) / LINE_CLEAR_MS)
    if (effect.progress >= 1) {
      this.cancelLineClear()
      this.elapsed = 0
      this.previousTime = time
      this.publish()
      return
    }
    this.draw(
      this.canvas.width / this.pixelRatio,
      this.canvas.height / this.pixelRatio,
      this.pixelRatio,
    )
  }

  private cancelLineClear(): void {
    this.lineClearEffect = null
    delete this.canvas.dataset.clearingRows
  }
}
