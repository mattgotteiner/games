import * as rules from './rules'
import { describe, expect, it } from 'vitest'
import { LAYOUTS, layoutForLevel, ROW_POINTS } from './levels'
import {
  applyAction, BALL_R, BRICK_H, BRICKS_TOP, BRICK_W, COLUMNS, createGame, DIFFICULTIES,
  DIFFICULTY_ORDER, FIELD_HEIGHT, FIELD_WIDTH, levelSpeed, PADDLE_TOP, STEP_MS, step,
  type BrickBurstDifficulty, type BrickBurstState, type Status,
} from './rules'

const playing = (patch: Partial<BrickBurstState> = {}): BrickBurstState => ({ ...applyAction(createGame(41), { type: 'serve' }), ...patch })
function isolated(row = 2, col = 5, kind: 'normal' | 'tough' = 'normal', damaged = false) {
  const bricks = Array.from({ length: 96 }, () => null) as (BrickBurstState['bricks'][number])[]
  bricks[row * COLUMNS + col] = { kind, damaged }
  return bricks
}
function brickShot(row = 2, col = 5, patch: Partial<BrickBurstState> = {}) {
  return playing({ bricks: isolated(row, col), ball: { x: col * BRICK_W + BRICK_W / 2, y: BRICKS_TOP + row * BRICK_H + BRICK_H + BALL_R + 0.5, vx: 0, vy: -300, speed: 300 }, ...patch })
}
function advance(s: BrickBurstState, n: number) { for (let i = 0; i < n; i++) s = step(s).state; return s }

describe('layouts', () => {
  it.each(LAYOUTS.map((layout, i) => [i, layout] as const))('checks layout %i', (i, layout) => {
    expect(layout).toHaveLength(8)
    for (const row of layout) { expect(row).toHaveLength(12); expect(row).toMatch(/^[.nt]+$/); expect(row).toBe([...row].reverse().join('')) }
    const all = layout.join('')
    expect(all.replaceAll('.', '').length).toBe([72, 42, 56, 54, 50][i])
    expect([...all].filter((c) => c === 't')).toHaveLength([0, 2, 12, 30, 2][i])
    expect(layoutForLevel(i + 6)).toEqual(layout)
  })
})
describe('Brick Burst rules', () => {
  it('starts serving, follows the clamped paddle, and serves along the guide', () => {
    let s = createGame(1)
    expect(s).toMatchObject({ status: 'serving', score: 0, lives: 3, level: 1, paddleX: 192 })
    s = applyAction(s, { type: 'paddle-to', x: 1000 }); expect(s.paddleX).toBe(352); expect(s.ball.x).toBe(352)
    s = applyAction(s, { type: 'steer', direction: -1 }); s = step(s).state
    expect(s.ball.x).toBe(s.paddleX)
    s = applyAction(s, { type: 'serve' }); expect(s.ball.vx).toBeCloseTo(300 * Math.sin(s.serveAngle)); expect(s.ball.vy).toBeCloseTo(-300 * Math.cos(s.serveAngle))
    expect(applyAction(s, { type: 'serve' })).toBe(s)
  })
  it('draws seeded angles between 8 and 30 degrees on both sides over 1000 seeds', () => {
    const signs = new Set<number>()
    for (let seed = 0; seed < 1000; seed++) {
      const s = createGame(seed), angle = Math.abs(s.serveAngle) * 180 / Math.PI
      expect(angle).toBeGreaterThanOrEqual(8); expect(angle).toBeLessThanOrEqual(30); signs.add(Math.sign(s.serveAngle))
    }
    expect(signs.size).toBe(2)
  })
  it.each([
    [{ x: 5, y: 250, vx: -150, vy: -260, speed: 300 }, 'left', 1, -1],
    [{ x: 379, y: 250, vx: 150, vy: -260, speed: 300 }, 'right', -1, -1],
    [{ x: 200, y: 5, vx: 150, vy: -260, speed: 300 }, 'top', 1, 1],
  ] as const)('reflects and leaves the %s wall', (ball, side, sx, sy) => {
    const result = step(playing({ ball }))
    expect(result.events).toContainEqual({ type: 'wall-hit', side })
    expect(Math.sign(result.state.ball.vx)).toBe(sx); expect(Math.sign(result.state.ball.vy)).toBe(sy)
    expect(step(result.state).events.filter((e) => e.type === 'wall-hit')).toHaveLength(0)
  })
  it.each([-1, -0.5, 0, 0.5, 1])('sets paddle angle proportional to offset %s', (offset) => {
    const x = 192 + offset * 37
    const { state, events } = step(playing({ ball: { x, y: 530.5, vx: 0, vy: 300, speed: 300 } }))
    expect(events).toContainEqual({ type: 'paddle-hit', x, offset })
    expect(state.ball.vx).toBeCloseTo(300 * Math.sin(offset * Math.PI / 3))
    expect(state.ball.vy).toBeCloseTo(-300 * Math.cos(offset * Math.PI / 3))
  })
  it('never rescues a ball below the paddle surface', () => {
    const s = applyAction(playing({ ball: { x: 80, y: PADDLE_TOP + 1, vx: 0, vy: 300, speed: 300 } }), { type: 'paddle-to', x: 80 })
    expect(step(s).state.ball.vy).toBe(300)
  })
  it('hits only one brick and resolves an equal distance toward the lower column', () => {
    const bricks = isolated(2, 5); bricks[2 * 12 + 6] = { kind: 'normal', damaged: false }
    const result = step(brickShot(2, 5, { bricks, ball: { x: 192, y: 116.5, vx: 0, vy: -300, speed: 300 } }))
    expect(result.events.filter((e) => e.type === 'brick-hit')).toMatchObject([{ row: 2, col: 5 }])
    expect(result.state.bricks[29]).toBeNull()
    expect(result.state.bricks[30]).toBe(bricks[30])
    expect(result.state.ball.vy).toBe(300)
  })
  it('resolves equal row distances toward the lower row and reflects the smaller x overlap', () => {
    const bricks = isolated(2, 5); bricks[3 * 12 + 5] = { kind: 'normal', damaged: false }
    const result = step(playing({ bricks, ball: { x: 154.5, y: 112, vx: 300, vy: 0, speed: 300 } }))
    expect(result.events.filter((e) => e.type === 'brick-hit')).toMatchObject([{ row: 2, col: 5 }])
    expect(result.state.bricks[29]).toBeNull()
    expect(result.state.bricks[41]).toBe(bricks[41])
    expect(result.state.ball.vx).toBe(-300)
  })
  it.each(DIFFICULTY_ORDER)('scores all row bands and tough hits on %s', (difficulty) => {
    const multiplier = DIFFICULTIES[difficulty].multiplier
    for (let row = 0; row < 8; row++) {
      const patch = { difficulty, activeSpeedMultiplier: multiplier }
      const first = step(brickShot(row, 5, { ...patch, bricks: isolated(row, 5, 'tough') }))
      expect(first.state.score).toBe(Math.round(10 * multiplier))
      expect(first.state.bricks[row * 12 + 5]).toEqual({ kind: 'tough', damaged: true })
      const second = step(brickShot(row, 5, { ...patch, bricks: first.state.bricks }))
      expect(second.events[0]).toMatchObject({ type: 'brick-hit', points: Math.round(ROW_POINTS[row] * 2 * multiplier), broken: true })
      const normal = step(brickShot(row, 5, patch))
      expect(normal.events[0]).toMatchObject({ points: Math.round(ROW_POINTS[row] * multiplier) })
    }
  })
  it('awards the Easy level 3 bonus, freezes 900 ms, then loads the next layout', () => {
    const result = step(brickShot(2, 5, { level: 3, difficulty: 'easy', activeSpeedMultiplier: 0.75 }))
    expect(result.events).toContainEqual({ type: 'level-cleared', level: 3, bonus: 1125 })
    expect(result.state.status).toBe('level-clear')
    const nearly = advance(result.state, 215)
    expect(nearly.status).toBe('level-clear'); expect(nearly.ball).toEqual(result.state.ball)
    const next = step(nearly); expect(next.events).toContainEqual({ type: 'level-started', level: 4 })
    expect(next.state).toMatchObject({ level: 4, status: 'serving', paddleX: 192, score: result.state.score, lives: 3 })
  })
  it('ramps every eighth hit, caps speed, and resets after loss', () => {
    for (const [hits, speed, expected] of [[6, 300, 300], [7, 300, 306], [79, 480, 480]]) {
      const result = step(brickShot(2, 5, { rallyHits: hits, ball: { ...brickShot().ball, speed } }))
      expect(result.state.ball.speed).toBe(expected)
    }
    const lost = step(playing({ rallyHits: 20, ball: { x: 50, y: 582, vx: 0, vy: 480, speed: 480 } }))
    expect(lost.state).toMatchObject({ status: 'ball-lost', lives: 2, rallyHits: 0 })
    expect(lost.state.ball.speed).toBe(300)
    expect(advance(lost.state, 143).status).toBe('ball-lost')
    expect(advance(lost.state, 144).status).toBe('serving')
  })
  it('locks speed and points to the serve until the next serve', () => {
    let s = applyAction(playing(), { type: 'pause' })
    s = applyAction(s, { type: 'set-difficulty', difficulty: 'hard' })
    s = applyAction(s, { type: 'resume' })
    expect(s.ball.speed).toBe(300); expect(s.activeSpeedMultiplier).toBe(1)
    const shot = step(brickShot(0, 5, { ...s, bricks: isolated(0, 5, 'tough', true), ball: brickShot(0, 5).ball }))
    expect(shot.events[0]).toMatchObject({ points: 80 })
    s = advance(step({ ...s, ball: { ...s.ball, y: 582, vy: 300 } }).state, 144)
    s = applyAction(s, { type: 'serve' }); expect(s.ball.speed).toBe(375); expect(s.activeSpeedMultiplier).toBe(1.25)
  })
  it('uses one level-speed formula for selected and serve-locked multipliers', () => {
    for (const level of [1, 4, 8, 100]) for (const d of DIFFICULTY_ORDER) {
      expect(rules.levelSpeedFor(level, DIFFICULTIES[d].multiplier)).toBe(levelSpeed(level, d))
    }
    const speed = levelSpeed(4, 'medium') * 1.6
    let s = brickShot(2, 5, { level: 4, rallyHits: 7, ball: { ...brickShot().ball, speed } })
    s = applyAction(s, { type: 'pause' })
    s = applyAction(s, { type: 'set-difficulty', difficulty: 'hard' })
    s = applyAction(s, { type: 'resume' })
    expect(step(s).state.ball.speed).toBeCloseTo(speed)
  })
  it('ends on the third loss and restarts at level one with chosen difficulty', () => {
    const result = step(playing({ lives: 1, score: 100, ball: { x: 50, y: 582, vx: 0, vy: 300, speed: 300 } }))
    expect(result.events).toEqual([{ type: 'ball-lost', livesLeft: 0 }, { type: 'game-over', score: 100 }])
    expect(step(result.state).state).toBe(result.state)
    expect(applyAction(result.state, { type: 'restart' })).toMatchObject({ lives: 3, score: 0, status: 'serving', level: 1 })
  })
  it.each(['serving', 'playing', 'ball-lost', 'level-clear'] as Status[])('pauses and resumes %s without advancing', (status) => {
    const s = { ...createGame(41), status, feedbackMs: 300 }
    const paused = applyAction(s, { type: 'pause' })
    expect(advance(paused, 1000)).toEqual(paused)
    expect(applyAction(paused, { type: 'paddle-to', x: 80 })).toBe(paused)
    expect(applyAction(paused, { type: 'resume' })).toEqual(s)
  })
  it('does not tunnel through a brick at maximum Hard speed from 0 to 60 degrees', () => {
    for (let degrees = 0; degrees <= 60; degrees++) {
      const angle = degrees * Math.PI / 180, speed = 840, x = 176, y = 120
      const ball = { x: x - 30 * Math.sin(angle), y: y + 30 * Math.cos(angle), vx: speed * Math.sin(angle), vy: -speed * Math.cos(angle), speed }
      let s = playing({ level: 100, difficulty: 'hard', activeSpeedMultiplier: 1.25, bricks: isolated(3, 5), ball })
      let hit = false
      for (let i = 0; i < 25; i++) { const result = step(s); s = result.state; hit ||= result.events.some((e) => e.type === 'brick-hit') }
      expect(hit, `angle ${degrees}`).toBe(true)
    }
  })
  it('does not tunnel through the paddle at maximum speed', () => {
    for (let degrees = 0; degrees <= 60; degrees++) {
      const a = degrees * Math.PI / 180, speed = 840
      const s = playing({ ball: { x: 192, y: 530, vx: speed * Math.sin(a), vy: speed * Math.cos(a), speed } })
      expect(advance(s, 2).ball.vy).toBeLessThan(0)
    }
  })
  it('keeps paths at least 30 degrees from horizontal over 200 seeds × 20000 steps', () => {
    let samples = 0
    for (let seed = 0; seed < 200; seed++) {
      let s = createGame(seed, DIFFICULTY_ORDER[seed % 3]), random = seed + 1
      for (let i = 0; i < 20000; i++) {
        random = (Math.imul(random, 1664525) + 1013904223) >>> 0
        if (s.status === 'serving') s = applyAction(s, { type: 'serve' })
        if (s.status === 'over') s = applyAction(s, { type: 'restart' })
        if (i % 100 === 0) s = applyAction(s, { type: 'steer', direction: (random % 3 - 1) as -1 | 0 | 1 })
        s = step(s).state
        if (s.status === 'playing') {
          samples++
          if (Math.abs(s.ball.vy) + 1e-8 < s.ball.speed * 0.5) throw Error(`Flat path seed ${seed} step ${i}`)
        }
      }
    }
    expect(samples).toBeGreaterThan(2000000)
  }, 60000)
  it('is deterministic for the same timed actions and never mutates a prior state', () => {
    let a = createGame(41), b = createGame(41)
    const seedState = a
    const original = JSON.stringify(seedState)
    Object.freeze(seedState.ball)
    seedState.bricks.forEach((b) => { if (b) Object.freeze(b) })
    Object.freeze(seedState.bricks); Object.freeze(seedState)
    for (let i = 0; i < 4000; i++) {
      if (i % 110 === 0) { const action = { type: 'steer', direction: (i % 3 - 1) as -1 | 0 | 1 } as const; a = applyAction(a, action); b = applyAction(b, action) }
      if (a.status === 'serving') { a = applyAction(a, { type: 'serve' }); b = applyAction(b, { type: 'serve' }) }
      a = step(a).state; b = step(b).state
    }
    expect(a).toEqual(b); expect(JSON.stringify(seedState)).toBe(original)
  })
  it.each(DIFFICULTY_ORDER)('caps level speed for %s', (d: BrickBurstDifficulty) => {
    expect(levelSpeed(1, d)).toBe(300 * DIFFICULTIES[d].multiplier)
    expect(levelSpeed(100, d)).toBe(420 * DIFFICULTIES[d].multiplier)
    expect(STEP_MS * levelSpeed(100, d) * 1.6 / 1000).toBeLessThan(BALL_R)
    expect(FIELD_WIDTH).toBe(384); expect(FIELD_HEIGHT).toBe(576)
  })
})
