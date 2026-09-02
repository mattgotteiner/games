import { useEffect, useRef, useState } from 'preact/hooks'
import {
  BlockDropController,
  type BlockDropControllerOptions,
} from './controller'
import {
  getInitialPieceCells,
  type BlockDropState,
  type GameAction,
  type GameStatus,
  type Tetromino,
} from './rules'
import { TETROMINO_COLORS } from './piece-metadata'

export type BlockDropControllerFactory = (
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  onStateChange: (state: BlockDropState) => void,
  options?: BlockDropControllerOptions,
) => Pick<BlockDropController, 'dispatch' | 'destroy' | 'getState'>

export interface BlockDropProps {
  readonly onReturn: () => void
  readonly controllerFactory?: BlockDropControllerFactory
}

const createBlockDropController: BlockDropControllerFactory = (...args) =>
  new BlockDropController(...args)

const gameplayControls: ReadonlyArray<readonly [GameAction, string, string]> = [
  ['left', 'Move left', '←'],
  ['right', 'Move right', '→'],
  ['rotate', 'Rotate clockwise', '↻'],
  ['soft-drop', 'Soft drop', '↓'],
  ['hard-drop', 'Hard drop', 'Drop'],
]

function NextPiece({ type }: { readonly type: Tetromino }) {
  const occupied = new Set(
    getInitialPieceCells(type).map(({ x, y }) => `${x},${y}`),
  )

  return (
    <section class="next-piece" aria-label={`Next piece: ${type} tetromino`}>
      <p class="next-piece-label">Next: {type}</p>
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

  useEffect(() => {
    if (canvasRef.current === null || boardRef.current === null) return
    const controller = controllerFactory(
      canvasRef.current,
      boardRef.current,
      (state) => {
        setStatus(state.status)
        setScore(state.score)
        setNext(state.next)
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

  return (
    <main class="block-drop" aria-labelledby="block-drop-heading">
      <header class="game-header">
        <button class="return-button" type="button" onClick={onReturn}>
          ← Catalog
        </button>
        <div class="game-details">
          <p class="app-kicker">Falling-block puzzle</p>
          <h1 id="block-drop-heading">Block Drop</h1>
          <p class="game-status" aria-live="polite">
            {status === 'playing'
              ? 'Playing'
              : status === 'paused'
                ? 'Paused'
                : 'Game over'}
          </p>
          <p class="game-score" aria-live="polite">
            Score: {score}
          </p>
          <NextPiece type={next} />
        </div>
      </header>

      <div class="game-layout">
        <div class="board-frame" ref={boardRef}>
          <canvas
            ref={canvasRef}
            aria-label="Block Drop board"
            role="img"
          />
        </div>
        <div class="game-controls" aria-label="Block Drop controls">
          {gameplayControls.map(([action, label, text]) => (
            <button
              class={`control control-${action}`}
              type="button"
              aria-label={label}
              disabled={controller === null || paused}
              onClick={() => act(action)}
              key={action}
            >
              {text}
            </button>
          ))}
          <button
            class="control control-pause"
            type="button"
            aria-label={paused ? 'Resume game' : 'Pause game'}
            disabled={controller === null || status === 'game-over'}
            onClick={() => act('pause')}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            class="control control-restart"
            type="button"
            aria-label="Restart game"
            disabled={controller === null}
            onClick={() => act('restart')}
          >
            Restart
          </button>
          <p class="key-help">
            Keys: arrows move and rotate, Space drops, P pauses, R restarts.
          </p>
        </div>
      </div>
    </main>
  )
}
