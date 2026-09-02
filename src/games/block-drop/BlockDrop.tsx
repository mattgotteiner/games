import { useEffect, useRef, useState } from 'preact/hooks'
import {
  BlockDropController,
  type BlockDropControllerOptions,
} from './controller'
import type { BlockDropState, GameAction, GameStatus } from './rules'

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

const controls: ReadonlyArray<readonly [GameAction, string, string]> = [
  ['left', 'Move left', '←'],
  ['right', 'Move right', '→'],
  ['rotate', 'Rotate clockwise', '↻'],
  ['soft-drop', 'Soft drop', '↓'],
  ['hard-drop', 'Hard drop', 'Drop'],
  ['restart', 'Restart game', 'Restart'],
]

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

  useEffect(() => {
    if (canvasRef.current === null || boardRef.current === null) return
    const controller = controllerFactory(
      canvasRef.current,
      boardRef.current,
      (state) => {
        setStatus(state.status)
        setScore(state.score)
      },
    )
    setController(controller)
    const initialState = controller.getState()
    setStatus(initialState.status)
    setScore(initialState.score)
    return () => {
      controller.destroy()
    }
  }, [controllerFactory])

  const act = (action: GameAction) => controller?.dispatch(action)

  return (
    <main class="block-drop" aria-labelledby="block-drop-heading">
      <header class="game-header">
        <button class="return-button" type="button" onClick={onReturn}>
          ← Catalog
        </button>
        <div>
          <p class="app-kicker">Falling-block puzzle</p>
          <h1 id="block-drop-heading">Block Drop</h1>
          <p class="game-status" aria-live="polite">
            {status === 'playing' ? 'Playing' : 'Game over'}
          </p>
          <p class="game-score" aria-live="polite">
            Score: {score}
          </p>
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
          {controls.map(([action, label, text]) => (
            <button
              class={`control control-${action}`}
              type="button"
              aria-label={label}
              disabled={controller === null}
              onClick={() => act(action)}
              key={action}
            >
              {text}
            </button>
          ))}
          <p class="key-help">
            Keys: arrows move and rotate, Space drops, R restarts.
          </p>
        </div>
      </div>
    </main>
  )
}
