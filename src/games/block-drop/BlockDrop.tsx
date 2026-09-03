import { useEffect, useRef, useState } from 'preact/hooks'
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
  ['rotate', 'Rotate clockwise', '↻', 'Rotate'],
  ['soft-drop', 'Soft drop', '↓', 'Down'],
]

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
      <p class="hud-label" id="scoring-guide-heading">
        Scoring
      </p>
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
            <ScoringGuide />
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
