import { fireEvent } from '@testing-library/preact'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BlockDropController } from './controller'
import { createEmptyBoard, createGame, type BlockDropState } from './rules'

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

describe('BlockDropController', () => {
  let canvas: HTMLCanvasElement
  let container: HTMLDivElement
  let resizeCallback: ResizeObserverCallback
  let disconnect: ReturnType<typeof vi.fn>
  let cancelFrame: ReturnType<typeof vi.fn<(handle: number) => void>>
  let frameCallback: FrameRequestCallback
  let pixelRatio: number

  beforeEach(() => {
    canvas = document.createElement('canvas')
    container = document.createElement('div')
    container.append(canvas)
    vi.spyOn(canvas, 'getContext').mockReturnValue(canvasContext())
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

  function createController(initialState = createGame(41)) {
    const onStateChange = vi.fn()
    const controller = new BlockDropController(
      canvas,
      container,
      onStateChange,
      {
        initialState,
        devicePixelRatio: () => pixelRatio,
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
    vi.mocked(container.getBoundingClientRect).mockReturnValue({
      ...container.getBoundingClientRect(),
      width: 100,
    })
    fireEvent(window, new Event('resize'))
    expect(controller.getState()).toBe(before)
    expect(canvas.width).toBe(width)
  })
})
