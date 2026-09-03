import { useEffect, useRef, useState } from 'preact/hooks'
import {
  BlockDropController,
  type BlockDropControllerOptions,
  type BlockDropStateListener,
} from './controller'
import {
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
  ['rotate', 'Rotate clockwise', '↻', 'Rotate'],
  ['right', 'Move right', '→', 'Right'],
  ['soft-drop', 'Soft drop', '↓', 'Down'],
]

function NextPiece({ type }: { readonly type: Tetromino }) {
  const occupied = new Set(
    getInitialPieceCells(type).map(({ x, y }) => `${x},${y}`),
  )

  return (
    <section class="next-piece" aria-label={`Next piece: ${type} tetromino`}>
      <p class="hud-label">Next</p>
      <div class="next-piece-grid" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => {
          const filled = occupied.has(`${index % 4},${Math.floor(index / 4)}`)
          return (
            <span
              class={`next-piece-cell${filled ? ' is-filled' : ''}`}
              style={
                filled
                  ? { backgroundColor: TETROMINO_COLORS[type] }
                  : undefined
              }
              key={index}
            />
          )
        })}
      </div>
      <p class="next-piece-name">{type} tetromino</p>
    </section>
  )
}

export function BlockDrop({
  onReturn,
  controllerFactory = createBlockDropController,
}: BlockDropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const [controller, setController] =
    useState<
      Pick<BlockDropController, 'dispatch' | 'destroy' | 'getState'> | null
    >(null)
  const [status, setStatus] = useState<GameStatus>('playing')
  const [score, setScore] = useState(0)
  const [next, setNext] = useState<Tetromino>('I')
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (canvasRef.current === null || boardRef.current === null) return
    const controller = controllerFactory(
      canvasRef.current,
      boardRef.current,
      (state, presentation) => {
        setStatus(state.status)
        setScore(state.score)
        setNext(state.next)
        setClearing(presentation?.clearing ?? false)
      },
    )
    setController(controller)
    const initialState = controller.getState()
    setStatus(initialState.status)
    setScore(initialState.score)
    setNext(initialState.next)
    return () => {
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

  return (
    <main class="block-drop" aria-labelledby="block-drop-heading">
      <header class="game-header">
        <button
          class="button-quiet return-button"
          type="button"
          onClick={onReturn}
        >
          ← Catalog
        </button>
        <div class="game-title">
          <p class="app-kicker">Falling-block puzzle</p>
          <h1 id="block-drop-heading">Block Drop</h1>
        </div>
      </header>

      <div class="game-layout">
        <div class="game-stage">
          <div class="board-frame" ref={boardRef}>
            <canvas
              ref={canvasRef}
              aria-label="Block Drop board"
              role="img"
            />
          </div>
          <aside class="game-hud" aria-label="Game information">
            <p
              class="game-score"
              aria-label={`Score: ${score}`}
              aria-live="polite"
            >
              <span class="hud-label">Score</span>
              <strong class="game-score-value">{score}</strong>
            </p>
            <NextPiece type={next} />
            <p
              class={`game-status status-${clearing ? 'clearing' : status}`}
              aria-live="polite"
            >
              <span class="status-dot" aria-hidden="true" />
              {statusText}
            </p>
          </aside>
        </div>

        <div class="game-controls" aria-label="Block Drop controls">
          <div
            class="control-group movement-controls"
            role="group"
            aria-label="Movement controls"
          >
            {movementControls.map(([action, label, symbol, caption]) => (
              <button
                class={`button-control control-${action}`}
                type="button"
                aria-label={label}
                disabled={gameplayDisabled}
                onClick={() => act(action)}
                key={action}
              >
                <span class="control-symbol" aria-hidden="true">
                  {symbol}
                </span>
                <span class="control-caption">{caption}</span>
              </button>
            ))}
          </div>
          <div
            class="control-group action-controls"
            role="group"
            aria-label="Game actions"
          >
            <button
              class="button-primary control-hard-drop"
              type="button"
              aria-label="Hard drop"
              disabled={gameplayDisabled}
              onClick={() => act('hard-drop')}
            >
              Drop
            </button>
            <button
              class="button-secondary control-pause"
              type="button"
              aria-label={paused ? 'Resume game' : 'Pause game'}
              disabled={
                controller === null || status === 'game-over' || clearing
              }
              onClick={() => act('pause')}
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button
              class="button-quiet control-restart"
              type="button"
              aria-label="Restart game"
              disabled={controller === null}
              onClick={() => act('restart')}
            >
              Restart
            </button>
          </div>
          <p class="key-help">
            Keys: arrows move and rotate, Space drops, P pauses, R restarts.
          </p>
        </div>
      </div>
    </main>
  )
}
