import { useEffect, useRef, useState } from 'preact/hooks'
import type { JSX } from 'preact'
import {
  BlockDropController,
  type BlockDropControllerOptions,
  type BlockDropStateListener,
} from './controller'
import {
  BLOCK_DROP_SCORING,
  getInitialPieceCells,
  type GameAction,
  type GameStatus,
  type Tetromino,
} from './rules'
import { TETROMINO_COLORS } from './piece-metadata'

export type BlockDropControllerFactory = (
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  onStateChange: BlockDropStateListener,
  options?: BlockDropControllerOptions,
) => Pick<BlockDropController, 'dispatch' | 'destroy' | 'getState'>

export interface BlockDropProps {
  readonly onReturn: () => void
  readonly controllerFactory?: BlockDropControllerFactory
}

const createBlockDropController: BlockDropControllerFactory = (...args) =>
  new BlockDropController(...args)

const movementControls: ReadonlyArray<
  readonly [GameAction, string, string, string]
> = [
  ['left', 'Move left', '←', 'Left'],
  ['right', 'Move right', '→', 'Right'],
  ['soft-drop', 'Soft drop', '↓', 'Down'],
]

interface GameplayControlProps {
  readonly action: GameAction
  readonly label: string
  readonly symbol: string
  readonly caption?: string
  readonly className: string
  readonly disabled: boolean
  readonly repeatable?: boolean
  readonly isGameActive: Readonly<{ current: boolean }>
  readonly onAction: (action: GameAction) => void
}

function GameplayControl({
  action,
  label,
  symbol,
  caption,
  className,
  disabled,
  repeatable = false,
  isGameActive,
  onAction,
}: GameplayControlProps) {
  const heldPointer = useRef<number | null>(null)
  const initialRepeat = useRef<ReturnType<typeof setTimeout> | null>(null)
  const repeatInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const clickSuppression = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ignoreNextClick = useRef(false)
  const dispatchRef = useRef(onAction)
  const disabledRef = useRef(disabled)
  dispatchRef.current = onAction
  disabledRef.current = disabled

  const clearRepeatTimers = () => {
    if (initialRepeat.current !== null) {
      clearTimeout(initialRepeat.current)
      initialRepeat.current = null
    }
    if (repeatInterval.current !== null) {
      clearInterval(repeatInterval.current)
      repeatInterval.current = null
    }
  }

  const canAct = () => !disabledRef.current && isGameActive.current

  const expireClickSuppression = () => {
    if (clickSuppression.current !== null) {
      clearTimeout(clickSuppression.current)
    }
    clickSuppression.current = window.setTimeout(() => {
      ignoreNextClick.current = false
      clickSuppression.current = null
    }, 0)
  }

  const stopForInactiveGame = () => {
    clearRepeatTimers()
    heldPointer.current = null
  }

  useEffect(() => {
    if (disabled || !isGameActive.current) stopForInactiveGame()
  }, [disabled, isGameActive.current])

  useEffect(
    () => () => {
      clearRepeatTimers()
      if (clickSuppression.current !== null) {
        clearTimeout(clickSuppression.current)
      }
    },
    [],
  )

  const handlePointerDown = (
    event: JSX.TargetedPointerEvent<HTMLButtonElement>,
  ) => {
    if (!event.isPrimary || event.button !== 0 || !canAct()) return
    if (heldPointer.current !== null) return

    heldPointer.current = event.pointerId
    ignoreNextClick.current = true
    if (clickSuppression.current !== null) {
      clearTimeout(clickSuppression.current)
      clickSuppression.current = null
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture can fail if the browser has already cancelled the pointer.
    }
    dispatchRef.current(action)

    if (!repeatable) return
    initialRepeat.current = window.setTimeout(() => {
      initialRepeat.current = null
      if (!canAct()) {
        stopForInactiveGame()
        return
      }
      dispatchRef.current(action)
      if (!canAct()) {
        stopForInactiveGame()
        return
      }
      repeatInterval.current = window.setInterval(() => {
        if (!canAct()) {
          stopForInactiveGame()
          return
        }
        dispatchRef.current(action)
      }, 50)
    }, 170)
  }

  const handlePointerUp = (
    event: JSX.TargetedPointerEvent<HTMLButtonElement>,
  ) => {
    if (heldPointer.current !== event.pointerId) return
    clearRepeatTimers()
    heldPointer.current = null
    expireClickSuppression()
  }

  const handlePointerCancel = (
    event: JSX.TargetedPointerEvent<HTMLButtonElement>,
  ) => {
    if (heldPointer.current !== event.pointerId) return
    clearRepeatTimers()
    heldPointer.current = null
    ignoreNextClick.current = false
    if (clickSuppression.current !== null) {
      clearTimeout(clickSuppression.current)
      clickSuppression.current = null
    }
  }

  const handleLostPointerCapture = (
    event: JSX.TargetedPointerEvent<HTMLButtonElement>,
  ) => {
    if (heldPointer.current !== event.pointerId) return
    clearRepeatTimers()
    heldPointer.current = null
    expireClickSuppression()
  }

  const handleClick = (event: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    if (event.detail !== 0 || ignoreNextClick.current || !canAct()) {
      ignoreNextClick.current = false
      return
    }
    dispatchRef.current(action)
  }

  return (
    <button
      class={className}
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handleLostPointerCapture}
      onClick={handleClick}
    >
      <span class="control-symbol" aria-hidden="true">
        {symbol}
      </span>
      {caption && <span class="control-caption">{caption}</span>}
    </button>
  )
}

function vibrateForGameEvent(
  presentation: Parameters<BlockDropStateListener>[1],
) {
  const duration = presentation?.clearedLines
    ? 20
    : presentation?.locked
      ? 10
      : 0
  if (
    duration === 0 ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
    typeof navigator.vibrate !== 'function'
  ) {
    return
  }
  navigator.vibrate(duration)
}

const PREVIEW_FRAME_SIZE = 6

function getPreviewShape(type: Tetromino) {
  const cells = getInitialPieceCells(type)
  const minX = Math.min(...cells.map(({ x }) => x))
  const maxX = Math.max(...cells.map(({ x }) => x))
  const minY = Math.min(...cells.map(({ y }) => y))
  const maxY = Math.max(...cells.map(({ y }) => y))

  return {
    cells: cells.map(({ x, y }) => ({ x: x - minX, y: y - minY })),
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

function NextPiece({ type }: { readonly type: Tetromino }) {
  const shape = getPreviewShape(type)

  return (
    <section class="next-piece" aria-label={`Next piece: ${type} tetromino`}>
      <p class="hud-label">Next</p>
      <div
        class="next-piece-grid"
        data-frame-size={PREVIEW_FRAME_SIZE}
        aria-hidden="true"
      >
        {Array.from(
          { length: PREVIEW_FRAME_SIZE * PREVIEW_FRAME_SIZE },
          (_, index) => (
            <span class="next-piece-grid-cell" key={index} />
          ),
        )}
        <span
          class="next-piece-shape"
          data-height={shape.height}
          data-width={shape.width}
          style={{
            gridTemplateColumns: `repeat(${shape.width}, 1fr)`,
            gridTemplateRows: `repeat(${shape.height}, 1fr)`,
            height: `${(shape.height / PREVIEW_FRAME_SIZE) * 100}%`,
            width: `${(shape.width / PREVIEW_FRAME_SIZE) * 100}%`,
          }}
        >
          {shape.cells.map(({ x, y }) => (
            <span
              class="next-piece-cell is-filled"
              key={`${x}-${y}`}
              style={{
                backgroundColor: TETROMINO_COLORS[type],
                gridColumn: x + 1,
                gridRow: y + 1,
              }}
            />
          ))}
        </span>
      </div>
      <p class="next-piece-name">{type} tetromino</p>
    </section>
  )
}

function ScoringGuide() {
  return (
    <section class="scoring-guide" aria-labelledby="scoring-guide-heading">
      <h2 class="hud-label" id="scoring-guide-heading">
        Scoring
      </h2>
      <dl class="scoring-rules">
        <div class="scoring-rule">
          <dt>Soft drop</dt>
          <dd>+{BLOCK_DROP_SCORING.softDropPerRow} / row</dd>
        </div>
        <div class="scoring-rule">
          <dt>Hard drop</dt>
          <dd>+{BLOCK_DROP_SCORING.hardDropPerRow} / row</dd>
        </div>
        <div class="scoring-rule">
          <dt>Gravity</dt>
          <dd>+{BLOCK_DROP_SCORING.gravityPerRow}</dd>
        </div>
        <div class="scoring-rule scoring-rule-lines">
          <dt>Lines cleared</dt>
          <dd>
            {Object.entries(BLOCK_DROP_SCORING.lineClears).map(
              ([count, points]) => (
              <span key={count}>
                {count}: +{points}
              </span>
              ),
            )}
          </dd>
        </div>
      </dl>
    </section>
  )
}

export function BlockDrop({
  onReturn,
  controllerFactory = createBlockDropController,
}: BlockDropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const helpButtonRef = useRef<HTMLButtonElement>(null)
  const helpDialogRef = useRef<HTMLDialogElement>(null)
  const isGameActive = useRef(false)
  const lastAnnouncedStatus = useRef<GameStatus | null>(null)
  const [controller, setController] =
    useState<
      Pick<BlockDropController, 'dispatch' | 'destroy' | 'getState'> | null
    >(null)
  const [status, setStatus] = useState<GameStatus>('playing')
  const [score, setScore] = useState(0)
  const [next, setNext] = useState<Tetromino>('I')
  const [clearing, setClearing] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    if (canvasRef.current === null || boardRef.current === null) return
    const controller = controllerFactory(
      canvasRef.current,
      boardRef.current,
      (state, presentation) => {
        isGameActive.current =
          state.status === 'playing' && !(presentation?.clearing ?? false)
        setStatus(state.status)
        setScore(state.score)
        setNext(state.next)
        setClearing(presentation?.clearing ?? false)
        vibrateForGameEvent(presentation)

        const previousStatus = lastAnnouncedStatus.current
        let message = ''
        if (presentation?.clearedLines) {
          const count = presentation.clearedLines
          message =
            `Cleared ${count} ${count === 1 ? 'line' : 'lines'}. ` +
            `Score ${state.score}.`
          if (state.status === 'game-over') message += ' Game over.'
        } else if (
          previousStatus === 'playing' &&
          state.status === 'paused'
        ) {
          message = 'Game paused.'
        } else if (
          previousStatus === 'paused' &&
          state.status === 'playing' &&
          presentation?.action !== 'restart'
        ) {
          message = 'Game resumed.'
        } else if (
          previousStatus !== 'game-over' &&
          state.status === 'game-over'
        ) {
          message = 'Game over.'
        }
        if (message) setAnnouncement(message)
        lastAnnouncedStatus.current = state.status
      },
    )
    setController(controller)
    const initialState = controller.getState()
    setStatus(initialState.status)
    setScore(initialState.score)
    setNext(initialState.next)
    isGameActive.current = initialState.status === 'playing'
    lastAnnouncedStatus.current = initialState.status
    return () => {
      isGameActive.current = false
      controller.destroy()
    }
  }, [controllerFactory])

  const act = (action: GameAction) => controller?.dispatch(action)
  const paused = status === 'paused'
  const gameplayDisabled =
    controller === null || paused || clearing || status === 'game-over'
  const statusText = clearing
    ? 'Clearing lines'
    : status === 'playing'
      ? 'Playing'
      : status === 'paused'
        ? 'Paused'
        : 'Game over'

  const openHelp = () => {
    if (status === 'playing') act('pause')
    const dialog = helpDialogRef.current
    if (dialog && !dialog.open) {
      try {
        dialog.showModal()
      } catch {
        dialog.setAttribute('open', '')
      }
    }
  }

  const closeHelp = () => {
    const dialog = helpDialogRef.current
    if (dialog?.open) {
      try {
        dialog.close()
      } catch {
        dialog.removeAttribute('open')
      }
      helpButtonRef.current?.focus()
    }
  }

  const returnFocusToHelp = () => helpButtonRef.current?.focus()

  return (
    <main class="block-drop" aria-labelledby="block-drop-heading">
      <header class="game-header">
        <button
          class="button-quiet return-button"
          type="button"
          aria-label="Return to catalog"
          onClick={onReturn}
        >
          <span class="control-symbol" aria-hidden="true">←</span>
          <span class="button-caption">Catalog</span>
        </button>
        <div class="game-title">
          <h1 id="block-drop-heading">Block Drop</h1>
        </div>
        <div class="session-actions" role="group" aria-label="Session actions">
          <button
            class="button-secondary session-action"
            type="button"
            aria-label={paused ? 'Resume game' : 'Pause game'}
            disabled={
              controller === null || status === 'game-over' || clearing
            }
            onClick={() => act('pause')}
          >
            <span class="control-symbol" aria-hidden="true">
              {paused ? '▶' : 'Ⅱ'}
            </span>
            <span class="button-caption">{paused ? 'Resume' : 'Pause'}</span>
          </button>
          <button
            class="button-quiet session-action"
            type="button"
            aria-label="Help"
            ref={helpButtonRef}
            onClick={openHelp}
          >
            <span class="control-symbol" aria-hidden="true">?</span>
            <span class="button-caption">Help</span>
          </button>
          <button
            class="button-quiet session-action"
            type="button"
            aria-label="Restart game"
            disabled={controller === null}
            onClick={() => act('restart')}
          >
            <span class="control-symbol" aria-hidden="true">↻</span>
            <span class="button-caption">Restart</span>
          </button>
        </div>
      </header>

      <div class="game-layout">
        <div class="game-stage">
          <div class="board-frame" ref={boardRef}>
            <div class="board-surface">
              <canvas
                ref={canvasRef}
                aria-label="Block Drop board"
                role="img"
              />
            </div>
          </div>
          <aside class="game-hud" aria-label="Game information">
            <p
              class="game-score"
              aria-label={`Score: ${score}`}
            >
              <span class="hud-label">Score</span>
              <strong class="game-score-value">{score}</strong>
            </p>
            <p
              class={`game-status status-${clearing ? 'clearing' : status}`}
            >
              <span class="status-dot" aria-hidden="true" />
              {statusText}
            </p>
            <NextPiece type={next} />
          </aside>
        </div>

        <div
          class="game-controls"
          role="group"
          aria-label="Block Drop controls"
        >
          <div
            class="control-group movement-controls"
            role="group"
            aria-label="Movement and soft drop controls"
          >
            {movementControls.map(([action, label, symbol, caption]) => (
              <GameplayControl
                className={`button-control control-${action}`}
                action={action}
                label={label}
                symbol={symbol}
                caption={caption}
                disabled={gameplayDisabled}
                repeatable
                isGameActive={isGameActive}
                onAction={act}
                key={action}
              />
            ))}
          </div>
          <div
            class="control-group action-controls"
            role="group"
            aria-label="Rotation and drop controls"
          >
            <GameplayControl
              className="button-control control-rotate"
              action="rotate"
              label="Rotate clockwise"
              symbol="↻"
              caption="Rotate"
              disabled={gameplayDisabled}
              isGameActive={isGameActive}
              onAction={act}
            />
            <GameplayControl
              className="button-primary control-hard-drop"
              action="hard-drop"
              label="Hard drop"
              symbol="⇊"
              caption="Drop"
              disabled={gameplayDisabled}
              isGameActive={isGameActive}
              onAction={act}
            />
          </div>
          <p class="key-help">
            Keys: arrows move and rotate, Space drops, P pauses, R restarts.
          </p>
        </div>
      </div>

      <dialog
        class="scoring-dialog"
        ref={helpDialogRef}
        aria-labelledby="help-dialog-heading"
        onClose={returnFocusToHelp}
        onCancel={(event) => {
          event.preventDefault()
          closeHelp()
        }}
      >
        <div class="dialog-heading-row">
          <h2 id="help-dialog-heading">Scoring and controls</h2>
          <button
            class="button-quiet dialog-close"
            type="button"
            aria-label="Close help"
            onClick={closeHelp}
          >
            ×
          </button>
        </div>
        <ScoringGuide />
        <section
          class="keyboard-guide"
          aria-labelledby="keyboard-guide-heading"
        >
          <h3 id="keyboard-guide-heading">Keyboard controls</h3>
          <dl>
            <div>
              <dt>← / →</dt>
              <dd>Move left or right</dd>
            </div>
            <div>
              <dt>↑</dt>
              <dd>Rotate clockwise</dd>
            </div>
            <div>
              <dt>↓</dt>
              <dd>Soft drop</dd>
            </div>
            <div>
              <dt>Space</dt>
              <dd>Hard drop</dd>
            </div>
            <div>
              <dt>P</dt>
              <dd>Pause or resume (when help is closed)</dd>
            </div>
            <div>
              <dt>R</dt>
              <dd>Restart the game (when help is closed)</dd>
            </div>
          </dl>
        </section>
      </dialog>
      <div
        class="visually-hidden"
        role="status"
        aria-label="Game announcements"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
    </main>
  )
}
