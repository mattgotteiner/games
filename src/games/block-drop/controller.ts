import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  applyActionWithEvents,
  type BlockDropDifficulty,
  createGame,
  getGravityInterval,
  getLandingPiece,
  getPieceCells,
  setDifficulty as updateDifficulty,
  stepGravityWithEvents,
  type BlockDropState,
  type GameAction,
  type LineClearEvent,
} from './rules'
import {
  BLOCK_DROP_THEMES,
  type BlockDropThemeId,
} from './themes'
import { hash } from './theme-renderers/shared'
import {
  classicRenderer,
  isBlockDropThemeImplemented,
  THEME_RENDERERS,
  type BoardGeometry,
  type CellDraw,
  type ThemeRenderer,
} from './theme-renderers'

export const KEY_ACTIONS: Readonly<Record<string, GameAction>> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'rotate',
  ArrowDown: 'soft-drop',
  ' ': 'hard-drop',
  c: 'hold',
  C: 'hold',
  p: 'pause',
  P: 'pause',
  r: 'restart',
  R: 'restart',
}

export interface BlockDropControllerOptions {
  readonly seed?: number
  readonly difficulty?: BlockDropDifficulty
  readonly theme?: BlockDropThemeId
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
  readonly clearPoints?: number
  readonly locked?: boolean
  readonly action?: GameAction
}

export type BlockDropStateListener = (
  state: BlockDropState,
  presentation?: BlockDropPresentationState,
) => void

interface LineClearEffect {
  readonly event: LineClearEvent
  readonly durationMs: number
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
  private theme = BLOCK_DROP_THEMES.classic
  private renderer: ThemeRenderer = classicRenderer
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
    const themeId =
      options.theme && isBlockDropThemeImplemented(options.theme)
        ? options.theme
        : 'classic'
    this.theme = BLOCK_DROP_THEMES[themeId]
    this.renderer = THEME_RENDERERS[themeId] ?? classicRenderer
    this.state =
      options.initialState ??
      createGame(options.seed ?? (Date.now() >>> 0), options.difficulty)
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

  setDifficulty(difficulty: BlockDropDifficulty): void {
    if (this.destroyed) return
    const nextState = updateDifficulty(this.state, difficulty)
    if (nextState === this.state) return
    this.state = nextState
    this.elapsed = 0
    this.previousTime = null
    this.publish()
  }

  setTheme(themeId: BlockDropThemeId): void {
    if (this.destroyed || !isBlockDropThemeImplemented(themeId)) return
    if (this.theme.id === themeId) return
    this.theme = BLOCK_DROP_THEMES[themeId]
    this.renderer = THEME_RENDERERS[themeId] ?? classicRenderer
    this.redraw()
  }

  dispatch(action: GameAction): void {
    if (this.destroyed) return
    if (
      this.lineClearEffect !== null &&
      action !== 'restart'
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
    const holdControlShortcut =
      action === 'hold' &&
      target instanceof Element &&
      target.closest('.control-hold') !== null
    if (
      target instanceof Element &&
      target.closest('dialog[open]') !== null
    ) {
      return
    }
    if (
      action !== 'pause' &&
      action !== 'restart' &&
      !holdControlShortcut &&
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
      const gravityInterval = getGravityInterval(
        this.state.level,
        this.state.difficulty,
      )
      this.elapsed += Math.min(
        Math.max(time - this.previousTime, 0),
        gravityInterval * 2,
      )
      let changed = false
      let steps = 0
      let lineClear: LineClearEvent | undefined
      let locked = false
      while (steps < 2) {
        const currentInterval = getGravityInterval(
          this.state.level,
          this.state.difficulty,
        )
        if (this.elapsed < currentInterval) break
        const result = stepGravityWithEvents(this.state)
        locked ||= result.state.board !== this.state.board
        this.state = result.state
        this.elapsed -= currentInterval
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

  private redraw(): void {
    this.draw(
      this.canvas.width / this.pixelRatio,
      this.canvas.height / this.pixelRatio,
      this.pixelRatio,
    )
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
      ...(lineClear
        ? {
            clearedLines: lineClear.rows.length,
            clearPoints: lineClear.points,
          }
        : {}),
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
    const geometry: BoardGeometry = {
      cell,
      offsetX,
      offsetY,
      width: boardWidth,
      height: boardHeight,
      ratio,
    }
    const cellDraw: {
      cell: number
      offsetX: number
      offsetY: number
      width: number
      height: number
      ratio: number
      x: number
      y: number
      type: CellDraw['type']
      seed: number
    } = {
      ...geometry,
      x: 0,
      y: 0,
      type: 'I',
      seed: 0,
    }

    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, width, height)
    this.renderer.drawBackground(context, this.theme, geometry)

    const board = this.lineClearEffect?.event.board ?? this.state.board
    const clearingRows = new Set(this.lineClearEffect?.event.rows ?? [])
    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      if (clearingRows.has(y)) continue
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const type = board[y][x]
        if (type === null) continue
        cellDraw.x = x
        cellDraw.y = y
        cellDraw.type = type
        cellDraw.seed = hash(x, y)
        this.renderer.drawCell(context, this.theme, cellDraw)
      }
    }

    if (
      this.lineClearEffect === null &&
      this.state.status !== 'game-over' &&
      this.state.active !== null
    ) {
      const landing = getLandingPiece(this.state)
      if (landing !== null && landing.y !== this.state.active.y) {
        const landingCells = getPieceCells(landing)
        for (let index = 0; index < landingCells.length; index += 1) {
          const point = landingCells[index]
          cellDraw.x = point.x
          cellDraw.y = point.y
          cellDraw.type = landing.type
          cellDraw.seed = hash(index, landing.type.charCodeAt(0))
          this.renderer.drawGhostCell(context, this.theme, cellDraw)
        }
      }
      const active = this.state.active
      if (active !== null) {
        const activeCells = getPieceCells(active)
        for (let index = 0; index < activeCells.length; index += 1) {
          const point = activeCells[index]
          cellDraw.x = point.x
          cellDraw.y = point.y
          cellDraw.type = active.type
          cellDraw.seed = hash(index, active.type.charCodeAt(0))
          this.renderer.drawCell(context, this.theme, cellDraw)
        }
      }
    }

    if (this.lineClearEffect !== null) {
      context.save()
      context.beginPath()
      context.rect(offsetX, offsetY, boardWidth, boardHeight)
      context.clip()
      this.renderer.drawLineClear(context, this.theme, {
        ...geometry,
        rows: this.lineClearEffect.event.rows,
        board: this.lineClearEffect.event.board,
        progress: this.lineClearEffect.progress,
      })
      context.restore()
    }

    if (this.state.status === 'paused') {
      context.fillStyle = this.theme.board.pausedVeil
      context.fillRect(offsetX, offsetY, boardWidth, boardHeight)
    } else if (this.state.status === 'game-over') {
      context.fillStyle = this.theme.board.gameOverVeil
      context.fillRect(offsetX, offsetY, boardWidth, boardHeight)
    }
  }

  private startLineClear(event: LineClearEvent): void {
    this.lineClearEffect = {
      event,
      durationMs: this.theme.clearMs,
      startedAt: null,
      progress: 0,
    }
    this.canvas.dataset.clearingRows = event.rows.join(',')
  }

  private advanceLineClear(time: number): void {
    const effect = this.lineClearEffect
    if (effect === null) return
    effect.startedAt ??= time
    effect.progress = Math.min(1, (time - effect.startedAt) / effect.durationMs)
    if (effect.progress >= 1) {
      this.cancelLineClear()
      this.elapsed = 0
      this.previousTime = time
      this.publish()
      return
    }
    this.redraw()
  }

  private cancelLineClear(): void {
    this.lineClearEffect = null
    delete this.canvas.dataset.clearingRows
  }
}
