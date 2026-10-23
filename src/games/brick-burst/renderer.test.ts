import { expect, it, vi } from 'vitest'
import { classicRenderer as r } from './renderer'
import { BRICK_BURST_LOOKS } from './palette'
import { recordingContext } from './test-support'
const look = BRICK_BURST_LOOKS.classic
it('uses the shared Classic chrome and deterministic Canvas recipes without random', () => {
  const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw Error('No random in rendering') })
  const draw = () => {
    const { context: ctx, calls } = recordingContext()
    r.drawBackground(ctx, look)
    for (let row = 0; row < 8; row++) for (const kind of ['normal', 'tough'] as const) {
      r.drawBrick(ctx, look, { row, col: 3, kind, damaged: false })
      r.drawBrick(ctx, look, { row, col: 4, kind, damaged: true })
    }
    for (const p of [0, 0.5, 1]) {
      r.drawBrickPop(ctx, look, { row: 3, col: 5, kind: 'normal' }, [176, 112], 300, p)
      r.drawBrickPop(ctx, look, { row: 1, col: 5, kind: 'tough' }, [176, 80], -300, p)
      r.drawPaddle(ctx, look, 192, { flash: p, contactX: 180 })
      r.drawBallLost(ctx, look, p); r.drawLevelSweep(ctx, look, p)
    }
    r.drawBall(ctx, look, 120, 330, [[121, 333], [122, 336]])
    r.drawServeGuide(ctx, look, 192, 531, 0.3)
    return calls
  }
  expect(draw()).toEqual(draw()); expect(random).not.toHaveBeenCalled(); random.mockRestore()
})
it('draws damage as a crack and one rivet, regardless of motion preference', () => {
  const whole = recordingContext(), damaged = recordingContext()
  r.drawBrick(whole.context, look, { row: 0, col: 0, kind: 'tough' })
  r.drawBrick(damaged.context, look, { row: 0, col: 0, kind: 'tough', damaged: true })
  expect(whole.calls.filter((c) => (c as string[])[0] === 'arc')).toHaveLength(2)
  expect(damaged.calls.filter((c) => (c as string[])[0] === 'arc')).toHaveLength(1)
  expect(damaged.calls.filter((c) => (c as string[])[0] === 'lineTo')).toHaveLength(6)
})

it('shows a tough-brick crack flash from its first progress frame', () => {
  const { context, calls } = recordingContext()
  r.drawBrick(context, look, { row: 1, col: 5, kind: 'tough', damaged: true }, { crackFlash: 0 })
  expect(calls).toContainEqual(['strokeStyle', 'rgb(255 255 255 / 0.8)'])
})
