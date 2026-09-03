import { fireEvent } from '@testing-library/preact'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BlockDropController,
  type BlockDropControllerOptions,
} from './controller'
import {
  BOARD_WIDTH,
  applyAction,
  createEmptyBoard,
  createGame,
  type BlockDropState,
} from './rules'

function canvasContext(): CanvasRenderingContext2D {
  return {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    setTransform: vi.fn(),
    stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D
}

function gameOverState(): BlockDropState {
  return {
    ...createGame(41),
    board: createEmptyBoard().map((row, y) =>
      row.map((cell, x) => (y === 0 && x === 0 ? 'Z' : cell)),
    ),
    active: null,
    status: 'game-over',
  }
}

function lineClearState(): BlockDropState {
  const board = createEmptyBoard().map((row) => [...row])
  for (let x = 0; x < BOARD_WIDTH; x += 1) {
    if (x !== 4 && x !== 5) board[19][x] = 'J'
  }
  return {
    ...createGame(41),
    board,
    active: { type: 'O', rotation: 0, x: 3, y: 18 },
  }
}

describe('BlockDropController', () => {
  let canvas: HTMLCanvasElement
  let container: HTMLDivElement
  let context: CanvasRenderingContext2D
  let resizeCallback: ResizeObserverCallback
  let disconnect: ReturnType<typeof vi.fn>
  let cancelFrame: ReturnType<typeof vi.fn<(handle: number) => void>>
  let frameCallback: FrameRequestCallback
  let pixelRatio: number

  beforeEach(() => {
    canvas = document.createElement('canvas')
    container = document.createElement('div')
    container.append(canvas)
    context = canvasContext()
    vi.spyOn(canvas, 'getContext').mockReturnValue(context)
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 180,
      height: 360,
      top: 0,
      right: 180,
      bottom: 360,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => undefined,
    })
    disconnect = vi.fn()
    cancelFrame = vi.fn<(handle: number) => void>()
    pixelRatio = 2
  })

  function createController(
    initialState = createGame(41),
    options: Partial<BlockDropControllerOptions> = {},
  ) {
    const onStateChange = vi.fn()
    const controller = new BlockDropController(
      canvas,
      container,
      onStateChange,
      {
        initialState,
        devicePixelRatio: () => pixelRatio,
        reducedMotion: () => false,
        requestFrame: vi.fn((callback: FrameRequestCallback) => {
          frameCallback = callback
          return 17
        }),
        cancelFrame,
        createResizeObserver: (callback) => {
          resizeCallback = callback
          return {
            observe: vi.fn(),
            unobserve: vi.fn(),
            disconnect,
          } as unknown as ResizeObserver
        },
        ...options,
      },
    )
    return { controller, onStateChange }
  }

  it('maps keyboard input to logical actions and advances bounded gravity', () => {
    const { controller } = createController()
    const startX = controller.getState().active?.x

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(controller.getState().active?.x).toBe((startX ?? 0) - 1)

    const startY = controller.getState().active?.y
    frameCallback(0)
    frameCallback(10_000)
    expect(controller.getState().active?.y).toBe((startY ?? 0) + 2)
    controller.destroy()
  })

  it('leaves gameplay keys available to focused controls while keeping global shortcuts', () => {
    const { controller } = createController()
    const button = document.createElement('button')
    document.body.append(button)
    const before = controller.getState()

    expect(fireEvent.keyDown(button, { key: ' ' })).toBe(true)
    expect(controller.getState()).toBe(before)

    expect(fireEvent.keyDown(button, { key: 'p' })).toBe(false)
    expect(controller.getState().status).toBe('paused')
    button.remove()
    controller.destroy()
  })

  it('freezes paused time and gives resume a fresh gravity interval', () => {
    const { controller } = createController()
    frameCallback(0)
    frameCallback(500)
    const beforePause = controller.getState()

    fireEvent.keyDown(window, { key: 'p' })
    expect(controller.getState().status).toBe('paused')
    frameCallback(10_000)
    frameCallback(20_000)
    expect(controller.getState().active).toEqual(beforePause.active)

    fireEvent.keyDown(window, { key: 'P' })
    expect(controller.getState().status).toBe('playing')
    frameCallback(30_000)
    frameCallback(30_699)
    expect(controller.getState().active).toEqual(beforePause.active)
    frameCallback(30_700)
    expect(controller.getState().active?.y).toBe(
      (beforePause.active?.y ?? 0) + 1,
    )
    controller.destroy()
  })

  it('restarts while paused and clears gravity timing', () => {
    const initial = createGame(41)
    const { controller } = createController(applyAction(initial, 'soft-drop'))
    frameCallback(0)
    frameCallback(600)
    controller.dispatch('pause')
    controller.dispatch('restart')

    expect(controller.getState()).toEqual(initial)
    frameCallback(10_000)
    frameCallback(10_699)
    expect(controller.getState().active).toEqual(initial.active)
    controller.destroy()
  })

  it('sizes the backing canvas for DPR and responds to resize observation', () => {
    const { controller } = createController()
    expect(canvas.width).toBe(360)
    expect(canvas.height).toBe(720)

    vi.mocked(container.getBoundingClientRect).mockReturnValue({
      ...container.getBoundingClientRect(),
      width: 120,
      height: 200,
      right: 120,
      bottom: 200,
    })
    resizeCallback([], {} as ResizeObserver)
    expect(canvas.width).toBe(200)
    expect(canvas.height).toBe(400)

    pixelRatio = 3
    frameCallback(0)
    expect(canvas.width).toBe(300)
    expect(canvas.height).toBe(600)
    controller.destroy()
  })

  it('exposes game over and restarts to a fresh playable state', () => {
    const { controller, onStateChange } = createController(gameOverState())
    expect(controller.getState().status).toBe('game-over')

    fireEvent.keyDown(window, { key: 'r' })
    expect(controller.getState().status).toBe('playing')
    expect(controller.getState().active).not.toBeNull()
    expect(controller.getState().board.flat().every((cell) => cell === null)).toBe(true)
    expect(onStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'playing' }),
      { clearing: false },
    )
    controller.destroy()
  })

  it('tears down frame, keyboard, and observer resources idempotently', () => {
    const { controller } = createController()
    const before = controller.getState()
    const width = canvas.width
    controller.destroy()
    controller.destroy()

    expect(cancelFrame).toHaveBeenCalledOnce()
    expect(cancelFrame).toHaveBeenCalledWith(17)
    expect(disconnect).toHaveBeenCalledOnce()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    fireEvent.keyDown(window, { key: 'p' })
    vi.mocked(container.getBoundingClientRect).mockReturnValue({
      ...container.getBoundingClientRect(),
      width: 100,
    })
    fireEvent(window, new Event('resize'))
    expect(controller.getState()).toBe(before)
    expect(canvas.width).toBe(width)
  })

  it('animates the exact completed rows before presenting the collapsed board', () => {
    const { controller, onStateChange } = createController(lineClearState())

    controller.dispatch('hard-drop')

    expect(canvas.dataset.clearingRows).toBe('19')
    expect(onStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ score: 100 }),
      { clearing: true },
    )
    expect(vi.mocked(context.fillRect)).toHaveBeenCalledWith(0, 342, 180, 18)

    frameCallback(1_000)
    frameCallback(1_090)
    expect(canvas.dataset.clearingRows).toBe('19')
    frameCallback(1_180)

    expect(canvas.dataset.clearingRows).toBeUndefined()
    expect(onStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ score: 100 }),
      { clearing: false },
    )
    controller.destroy()
  })

  it('gates gameplay during a clear and resumes with fresh gravity timing', () => {
    const { controller } = createController(lineClearState())
    controller.dispatch('hard-drop')
    const cleared = controller.getState()

    for (const action of [
      'left',
      'right',
      'rotate',
      'soft-drop',
      'hard-drop',
      'pause',
    ] as const) {
      controller.dispatch(action)
      expect(controller.getState()).toBe(cleared)
    }

    frameCallback(0)
    frameCallback(180)
    frameCallback(879)
    expect(controller.getState().active).toEqual(cleared.active)
    frameCallback(880)
    expect(controller.getState().active?.y).toBe((cleared.active?.y ?? 0) + 1)
    controller.destroy()
  })

  it('lets restart cancel active clear feedback immediately', () => {
    const initial = lineClearState()
    const { controller, onStateChange } = createController(initial)
    controller.dispatch('hard-drop')

    controller.dispatch('restart')

    expect(controller.getState()).toEqual(createGame(initial.initialSeed))
    expect(canvas.dataset.clearingRows).toBeUndefined()
    expect(onStateChange).toHaveBeenLastCalledWith(controller.getState(), {
      clearing: false,
    })
    controller.destroy()
  })

  it('skips animated feedback when reduced motion is preferred', () => {
    const { controller, onStateChange } = createController(lineClearState(), {
      reducedMotion: () => true,
    })

    controller.dispatch('hard-drop')

    expect(controller.getState().score).toBe(100)
    expect(canvas.dataset.clearingRows).toBeUndefined()
    expect(onStateChange).toHaveBeenLastCalledWith(controller.getState(), {
      clearing: false,
    })
    controller.destroy()
  })

  it('cleans up active clear feedback during teardown', () => {
    const { controller } = createController(lineClearState())
    controller.dispatch('hard-drop')

    controller.destroy()

    expect(canvas.dataset.clearingRows).toBeUndefined()
  })
})
