import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  applyAction,
  createGame,
  getPieceCells,
  stepGravity,
  type BlockDropState,
  type GameAction,
  type Tetromino,
} from './rules'

const GRAVITY_MS = 700
const MAX_FRAME_MS = GRAVITY_MS * 2

const COLORS: Readonly<Record<Tetromino, string>> = {
  I: '#38bdf8',
  J: '#818cf8',
  L: '#fb923c',
  O: '#facc15',
  S: '#4ade80',
  T: '#c084fc',
  Z: '#fb7185',
}

export const KEY_ACTIONS: Readonly<Record<string, GameAction>> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'rotate',
  ArrowDown: 'soft-drop',
  ' ': 'hard-drop',
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
}

export class BlockDropController {
  private state: BlockDropState
  private frameId: number | null = null
  private previousTime: number | null = null
  private elapsed = 0
  private destroyed = false
  private readonly context: CanvasRenderingContext2D
  private readonly requestFrame: typeof requestAnimationFrame
  private readonly cancelFrame: typeof cancelAnimationFrame
  private readonly observer: ResizeObserver
  private readonly devicePixelRatio: () => number

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly container: HTMLElement,
    private readonly onStateChange: (state: BlockDropState) => void,
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
    this.state = applyAction(this.state, action)
    if (action === 'restart') {
      this.elapsed = 0
      this.previousTime = null
    }
    this.publish()
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
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const action = KEY_ACTIONS[event.key]
    if (action === undefined) return
    event.preventDefault()
    this.dispatch(action)
  }

  private readonly handleResize = (): void => this.resize()

  private readonly tick = (time: number): void => {
    if (this.destroyed) return

    if (this.previousTime !== null && this.state.status === 'playing') {
      this.elapsed += Math.min(Math.max(time - this.previousTime, 0), MAX_FRAME_MS)
      let changed = false
      let steps = 0
      while (this.elapsed >= GRAVITY_MS && steps < 2) {
        this.state = stepGravity(this.state)
        this.elapsed -= GRAVITY_MS
        changed = true
        steps += 1
      }
      if (changed) this.publish()
    }
    this.previousTime = time
    this.frameId = this.requestFrame(this.tick)
  }

  private resize(): void {
    const bounds = this.container.getBoundingClientRect()
    const availableWidth = Math.max(1, bounds.width)
    const containerHeight =
      bounds.height > 1 ? bounds.height : availableWidth * 2
    const viewportHeight = Math.max(1, window.innerHeight - bounds.top - 8)
    const availableHeight = Math.min(containerHeight, viewportHeight)
    const cssHeight = Math.max(1, Math.min(availableHeight, availableWidth * 2))
    const cssWidth = cssHeight / 2
    const ratio = Math.max(1, this.devicePixelRatio())

    this.canvas.style.width = `${cssWidth}px`
    this.canvas.style.height = `${cssHeight}px`
    this.canvas.width = Math.round(cssWidth * ratio)
    this.canvas.height = Math.round(cssHeight * ratio)
    this.draw(cssWidth, cssHeight, ratio)
  }

  private publish(): void {
    this.draw(
      this.canvas.width / Math.max(1, this.devicePixelRatio()),
      this.canvas.height / Math.max(1, this.devicePixelRatio()),
      Math.max(1, this.devicePixelRatio()),
    )
    this.onStateChange(this.state)
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

    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const locked = this.state.board[y][x]
        if (locked !== null) this.drawCell(x, y, locked, cell, offsetX, offsetY)
      }
    }
    if (this.state.active !== null) {
      for (const { x, y } of getPieceCells(this.state.active)) {
        this.drawCell(x, y, this.state.active.type, cell, offsetX, offsetY)
      }
    }

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

    if (this.state.status === 'game-over') {
      context.fillStyle = 'rgb(7 17 31 / 76%)'
      context.fillRect(offsetX, offsetY, boardWidth, boardHeight)
      context.fillStyle = '#f8fafc'
      context.font = `700 ${Math.max(16, cell)}px system-ui`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText('GAME OVER', width / 2, height / 2)
    }
  }

  private drawCell(
    x: number,
    y: number,
    type: Tetromino,
    size: number,
    offsetX: number,
    offsetY: number,
  ): void {
    const inset = Math.max(1, size * 0.08)
    this.context.fillStyle = COLORS[type]
    this.context.fillRect(
      offsetX + x * size + inset,
      offsetY + y * size + inset,
      size - inset * 2,
      size - inset * 2,
    )
  }
}
