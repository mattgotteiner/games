import { afterEach, describe, expect, it, vi } from 'vitest'
import { BrickBurstController, type BrickBurstControllerOptions } from './controller'
import { applyAction, createGame, STEP_MS, type BrickBurstState } from './rules'
import { classicRenderer } from './renderer'
import { fakeObserver, pointer, recordingContext } from './test-support'
const controllers: BrickBurstController[] = []
afterEach(() => { controllers.splice(0).forEach((c) => c.destroy()); vi.restoreAllMocks(); document.body.innerHTML = '' })
function setup(options: BrickBurstControllerOptions = {}, width = 384) {
  const container = document.createElement('div'), canvas = document.createElement('canvas'), bar = document.createElement('div')
  const left = document.createElement('button'), right = document.createElement('button'), serve = document.createElement('button')
  left.dataset.direction = '-1'; right.dataset.direction = '1'; serve.dataset.serve = ''
  bar.append(left, serve, right); container.append(canvas); document.body.append(container, bar)
  vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ width, height: width * 1.5, left: 0 } as DOMRect)
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ width, height: width * 1.5, left: 0 } as DOMRect)
  const { context, calls } = recordingContext(); vi.spyOn(canvas, 'getContext').mockReturnValue(context)
  let frame: FrameRequestCallback = () => {}, now = 0, ratio = 2
  const cancel = vi.fn(), observer = fakeObserver(), listener = vi.fn()
  const controller = new BrickBurstController(canvas, container, listener, {
    seed: 41, reducedMotion: () => false, now: () => now, devicePixelRatio: () => ratio,
    createResizeObserver: () => observer, requestFrame: (cb) => { frame = cb; return 11 }, cancelFrame: cancel,
    controlBar: bar, ...options,
  })
  controllers.push(controller)
  return { controller, canvas, bar, left, right, serve, listener, calls, observer, cancel,
    frame: (time: number) => { now = time; frame(time) }, setRatio: (value: number) => { ratio = value } }
}
const playing = (): BrickBurstState => applyAction(createGame(41), { type: 'serve' })
describe('Brick Burst controller', () => {
  it('reaches identical states with 60 and 120 Hz frames', () => {
    const a = setup({ initialState: playing() }), b = setup({ initialState: playing() })
    a.frame(0); b.frame(0)
    for (let i = 1; i <= 120; i++) { if (i % 2 === 0) a.frame(i * 1000 / 120); b.frame(i * 1000 / 120) }
    expect(a.controller.getState()).toEqual(b.controller.getState())
  })
  it('caps long frames at 100 ms and discards all paused time on resume', () => {
    const a = setup({ initialState: playing() }), b = setup({ initialState: playing() })
    a.frame(0); b.frame(0); a.frame(10000); b.frame(100)
    expect(a.controller.getState()).toEqual(b.controller.getState())
    a.controller.dispatch({ type: 'pause' }); const frozen = a.controller.getState()
    a.frame(20000); a.frame(30000); expect(a.controller.getState()).toEqual(frozen)
    a.controller.dispatch({ type: 'resume' }); const resumed = a.controller.getState()
    a.frame(40000); expect(a.controller.getState()).toEqual(resumed)
    a.frame(40000 + STEP_MS); expect(a.controller.getState().ball.y).toBeLessThan(resumed.ball.y)
  })
  it.each([192, 384])('maps relative drags 1:1 at board width %i', (width) => {
    const { canvas, controller } = setup({}, width)
    pointer(canvas, 'pointerdown', 40)
    pointer(canvas, 'pointermove', 90)
    expect(controller.getState().paddleX).toBeCloseTo(192 + 50 * 384 / width)
    pointer(canvas, 'pointerup', 90)
    expect(controller.getState().status).toBe('serving')
  })
  it('serves on a short tap without moving, never after a drag that returns to its start', () => {
    const a = setup(); pointer(a.canvas, 'pointerdown', 60); pointer(a.canvas, 'pointermove', 66); pointer(a.canvas, 'pointerup', 66)
    expect(a.controller.getState()).toMatchObject({ status: 'playing', paddleX: 192 })
    const b = setup(); pointer(b.canvas, 'pointerdown', 60); pointer(b.canvas, 'pointermove', 120); pointer(b.canvas, 'pointermove', 60); pointer(b.canvas, 'pointerup', 60)
    expect(b.controller.getState().status).toBe('serving')
    // Safari may synthesize a MouseEvent click after touch; it must stay suppressed.
    b.canvas.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    expect(b.controller.getState().status).toBe('serving')
  })
  it('steers from gaps in the control bar and gives held buttons priority', () => {
    const t = setup(); pointer(t.bar, 'pointerdown', 60); pointer(t.bar, 'pointermove', 110)
    expect(t.controller.getState().paddleX).toBe(242)
    pointer(t.left, 'pointerdown', 20, 200, { pointerId: 2, isPrimary: false })
    pointer(t.bar, 'pointermove', 160)
    expect(t.controller.getState().paddleX).toBe(242)
    t.frame(0); t.frame(100); expect(t.controller.getState().paddleX).toBeCloseTo(200)
    pointer(t.left, 'pointercancel', 20, 200, { pointerId: 2 })
    expect(t.controller.getState().steer).toBe(0)
    pointer(t.bar, 'pointerup', 160); expect(t.controller.getState().status).toBe('serving')
  })
  it('combines buttons and keys; opposite directions stop, release and blur clear input', () => {
    const t = setup()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    pointer(t.left, 'pointerdown', 10); expect(t.controller.getState().steer).toBe(0)
    pointer(t.left, 'pointerup', 10); expect(t.controller.getState().steer).toBe(1)
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' })); expect(t.controller.getState().steer).toBe(0)
    pointer(t.right, 'pointerdown', 10); expect(t.controller.getState().steer).toBe(1)
    window.dispatchEvent(new Event('blur')); expect(t.controller.getState().steer).toBe(0)
    const x = t.controller.getState().paddleX; t.left.click(); expect(t.controller.getState().paddleX).toBe(x - 24)
    t.serve.click(); expect(t.controller.getState().status).toBe('playing')
  })
  it('supports pointer following, mouse serve, keyboard pause and restart, and visibility pause', () => {
    const t = setup(); pointer(t.canvas, 'pointermove', 80, 200, { pointerType: 'mouse' }); expect(t.controller.getState().paddleX).toBe(80)
    t.canvas.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })); expect(t.controller.getState().status).toBe('playing')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' })); expect(t.controller.getState().status).toBe('paused')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' })); expect(t.controller.getState().status).toBe('playing')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' })); expect(t.controller.getState().status).toBe('serving')
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden'); document.dispatchEvent(new Event('visibilitychange'))
    expect(t.controller.getState().status).toBe('paused')
  })
  it.each(['ball-lost', 'level-clear'] as const)('keeps held keys through %s into the first serving step', (status) => {
    const t = setup({ initialState: { ...createGame(41), status, feedbackMs: STEP_MS } })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    t.frame(0); t.frame(STEP_MS)
    const x = t.controller.getState().paddleX
    expect(t.controller.getState().status).toBe('serving')
    t.frame(2 * STEP_MS)
    expect(t.controller.getState().paddleX).toBeLessThan(x)
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }))
    const stopped = t.controller.getState().paddleX
    t.frame(3 * STEP_MS); expect(t.controller.getState().paddleX).toBe(stopped)
  })
  it.each(['ball-lost', 'level-clear'] as const)('keeps an existing hold across entry to %s', (status) => {
    const initial = status === 'ball-lost'
      ? { ...playing(), ball: { x: 80, y: 582, vx: 0, vy: 300, speed: 300 } }
      : { ...playing(), bricks: Array.from({ length: 96 }, (_, i) => i === 77 ? { kind: 'normal' as const, damaged: false } : null), ball: { x: 176, y: 181.5, vx: 0, vy: -300, speed: 300 } }
    const t = setup({ initialState: initial })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    t.frame(0); t.frame(STEP_MS)
    expect(t.controller.getState().status).toBe(status)
    for (let i = 2; i < 300 && t.controller.getState().status !== 'serving'; i++) t.frame(i * STEP_MS)
    const x = t.controller.getState().paddleX
    expect(t.controller.getState().steer).toBe(-1)
    // Continue from the last delivered time without adding a catch-up jump.
    t.frame(300 * STEP_MS)
    expect(t.controller.getState().paddleX).toBeLessThan(x)
  })
  it('records buttons during a freeze and keys during pause without moving until resumed', () => {
    const t = setup({ initialState: { ...createGame(41), status: 'ball-lost', feedbackMs: STEP_MS } })
    pointer(t.left, 'pointerdown', 10)
    expect(t.controller.getState().paddleX).toBe(192)
    t.frame(0); t.frame(STEP_MS); t.frame(2 * STEP_MS)
    expect(t.controller.getState().paddleX).toBeLessThan(192)
    pointer(t.left, 'pointerup', 10)
    t.controller.dispatch({ type: 'pause' })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    const x = t.controller.getState().paddleX
    t.frame(1000); expect(t.controller.getState().paddleX).toBe(x)
    t.controller.dispatch({ type: 'resume' }); t.frame(2000); t.frame(2000 + STEP_MS)
    expect(t.controller.getState().paddleX).toBeGreaterThan(x)
  })
  it('resizes the backing store when DPR changes without changing logical positions', () => {
    const t = setup({}, 192); expect(t.canvas.width).toBe(384); expect(t.canvas.height).toBe(576)
    t.controller.dispatch({ type: 'paddle-to', x: 100 }); t.setRatio(3); t.frame(0)
    expect(t.canvas.width).toBe(576); expect(t.canvas.height).toBe(864); expect(t.controller.getState().paddleX).toBe(100)
  })
  it('allocates the backing store only once at sub-1 DPR over ten frames', () => {
    const width = vi.spyOn(HTMLCanvasElement.prototype, 'width', 'set')
    const height = vi.spyOn(HTMLCanvasElement.prototype, 'height', 'set')
    const t = setup({ devicePixelRatio: () => 0.9 })
    for (let i = 0; i < 10; i++) t.frame(i * 16)
    window.dispatchEvent(new Event('resize'))
    expect(width).toHaveBeenCalledTimes(1); expect(height).toHaveBeenCalledTimes(1)
  })
  it('draws no trail, pops, flash, sweep, or layout fade under reduced motion', () => {
    const renderer = Object.fromEntries(Object.entries(classicRenderer).map(([key, fn]) => [key, vi.fn(fn)])) as unknown as typeof classicRenderer
    const t = setup({ initialState: playing(), reducedMotion: () => true, renderer })
    t.frame(0); for (let i = 1; i <= 200; i++) t.frame(i * 16)
    expect(renderer.drawBrickPop).not.toHaveBeenCalled(); expect(renderer.drawLevelSweep).not.toHaveBeenCalled()
    for (const call of vi.mocked(renderer.drawBall).mock.calls) expect(call[4]).toEqual([])
    for (const call of vi.mocked(renderer.drawBrick).mock.calls) expect(call[3]).toMatchObject({ alpha: 1, dy: 0 })
  })
  it('keeps level-clear feedback static with reduced motion', () => {
    const sweep = vi.spyOn(classicRenderer, 'drawLevelSweep')
    const t = setup({ initialState: { ...createGame(41), status: 'level-clear', feedbackMs: 600 }, reducedMotion: () => true })
    t.frame(0); t.frame(100)
    expect(t.controller.getState().feedbackMs).toBeCloseTo(500)
    expect(sweep).not.toHaveBeenCalled()
  })
  it('cancels the frame, disconnects observation, and removes every listener on destroy', () => {
    const add = vi.spyOn(EventTarget.prototype, 'addEventListener'), remove = vi.spyOn(EventTarget.prototype, 'removeEventListener')
    const t = setup(), registrations = [...add.mock.calls], targets = [...add.mock.contexts]
    t.controller.destroy(); t.controller.destroy()
    expect(t.cancel).toHaveBeenCalledTimes(1); expect(t.observer.disconnect).toHaveBeenCalledTimes(1)
    for (let i = 0; i < registrations.length; i++) expect(remove.mock.calls.some((c, j) => c[0] === registrations[i][0] && c[1] === registrations[i][1] && remove.mock.contexts[j] === targets[i])).toBe(true)
    const state = t.controller.getState(); t.frame(2000); t.controller.dispatch({ type: 'serve' })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })); expect(t.controller.getState()).toBe(state)
  })
})
