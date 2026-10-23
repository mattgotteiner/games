import { layoutForLevel, ROW_POINTS } from './levels'

export const FIELD_WIDTH = 384, FIELD_HEIGHT = 576
export const COLUMNS = 12, ROWS = 8, BRICK_W = 32, BRICK_H = 16, BRICKS_TOP = 64
export const PADDLE_W = 64, PADDLE_H = 10, PADDLE_TOP = 536, PADDLE_SPEED = 540
export const BALL_R = 5, BASE_SPEED = 390, STEP_MS = 1000 / 240
export const NUDGE = 24, BALL_LOST_MS = 400, LEVEL_CLEAR_MS = 650
export const RALLY_HITS_PER_INCREASE = 4, RALLY_SPEED_FACTOR = 1.04, RALLY_SPEED_CAP = 1.6
export const DIFFICULTIES = {
  easy: { label: 'Easy', multiplier: 0.75 },
  medium: { label: 'Medium', multiplier: 1 },
  hard: { label: 'Hard', multiplier: 1.25 },
} as const
export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'] as const
export type BrickBurstDifficulty = keyof typeof DIFFICULTIES
export type BrickKind = 'normal' | 'tough'
export interface Brick { readonly kind: BrickKind; readonly damaged: boolean }
export type Status = 'serving' | 'playing' | 'paused' | 'ball-lost' | 'level-clear' | 'over'
export interface BrickBurstState {
  readonly rng: number
  readonly status: Status
  readonly resumeStatus: Status | null
  readonly level: number
  readonly score: number
  readonly lives: number
  readonly difficulty: BrickBurstDifficulty
  readonly activeSpeedMultiplier: number
  readonly bricks: ReadonlyArray<Brick | null>
  readonly paddleX: number
  readonly steer: -1 | 0 | 1
  readonly ball: Readonly<{ x: number; y: number; vx: number; vy: number; speed: number }>
  readonly serveAngle: number
  readonly rallyHits: number
  readonly feedbackMs: number
}
export type BrickBurstAction =
  | { type: 'steer'; direction: -1 | 0 | 1 }
  | { type: 'paddle-to'; x: number }
  | { type: 'nudge'; direction: -1 | 1 }
  | { type: 'serve' | 'pause' | 'resume' | 'restart' }
  | { type: 'set-difficulty'; difficulty: BrickBurstDifficulty }
export type BrickBurstEvent =
  | { type: 'brick-hit'; row: number; col: number; kind: BrickKind; broken: boolean; points: number; impactX: number; impactY: number; ballVx: number; ballVy: number }
  | { type: 'paddle-hit'; x: number; offset: number }
  | { type: 'wall-hit'; side: 'left' | 'right' | 'top' }
  | { type: 'ball-lost'; livesLeft: number }
  | { type: 'level-cleared'; level: number; bonus: number }
  | { type: 'level-started'; level: number }
  | { type: 'game-over'; score: number }

export const isDifficulty = (raw: string): raw is BrickBurstDifficulty => raw === 'easy' || raw === 'medium' || raw === 'hard'
const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n))
export const levelSpeedFor = (level: number, multiplier: number): number =>
  BASE_SPEED * multiplier * Math.min(1.4, 1 + 0.06 * (level - 1))
export const levelSpeed = (level: number, difficulty: BrickBurstDifficulty): number =>
  levelSpeedFor(level, DIFFICULTIES[difficulty].multiplier)
function bricksForLevel(level: number): (Brick | null)[] {
  return layoutForLevel(level).join('').split('').map((char) => char === '.' ? null : { kind: char === 't' ? 'tough' : 'normal', damaged: false })
}
// Mulberry32: only serving consumes randomness; presentation never changes this state.
function nextAngle(rng: number): { rng: number; serveAngle: number } {
  const next = () => {
    rng = (rng + 0x6d2b79f5) >>> 0
    let t = rng
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const sign = next() < 0.5 ? -1 : 1
  const serveAngle = sign * (8 + next() * 22) * Math.PI / 180
  return { rng, serveAngle }
}
function restingBall(x: number, speed: number): BrickBurstState['ball'] {
  return { x, y: PADDLE_TOP - BALL_R, vx: 0, vy: 0, speed }
}
export function createGame(seed: number, difficulty: BrickBurstDifficulty = 'medium'): BrickBurstState {
  return { ...nextAngle(seed >>> 0), status: 'serving', resumeStatus: null, level: 1, score: 0, lives: 3,
    difficulty, activeSpeedMultiplier: DIFFICULTIES[difficulty].multiplier,
    bricks: bricksForLevel(1), paddleX: FIELD_WIDTH / 2, steer: 0,
    ball: restingBall(FIELD_WIDTH / 2, levelSpeed(1, difficulty)), rallyHits: 0, feedbackMs: 0 }
}
export function applyAction(s: BrickBurstState, a: BrickBurstAction): BrickBurstState {
  if (a.type === 'restart') return createGame(s.rng, s.difficulty)
  if (a.type === 'set-difficulty') return { ...s, difficulty: a.difficulty }
  if (a.type === 'pause') return s.status === 'paused' || s.status === 'over' ? s :
    { ...s, status: 'paused', resumeStatus: s.status, steer: 0 }
  if (a.type === 'resume') return s.status !== 'paused' ? s :
    { ...s, status: s.resumeStatus ?? 'serving', resumeStatus: null, steer: 0 }
  if (s.status !== 'serving' && s.status !== 'playing') return s
  if (a.type === 'steer') return { ...s, steer: a.direction }
  if (a.type === 'paddle-to' || a.type === 'nudge') {
    const x = a.type === 'paddle-to' ? a.x : s.paddleX + a.direction * NUDGE
    if (!Number.isFinite(x)) return s
    const paddleX = clamp(x, PADDLE_W / 2, FIELD_WIDTH - PADDLE_W / 2)
    return { ...s, paddleX, ball: s.status === 'serving' ? restingBall(paddleX, s.ball.speed) : s.ball }
  }
  if (a.type === 'serve' && s.status === 'serving') {
    const speed = levelSpeed(s.level, s.difficulty)
    return { ...s, status: 'playing', rallyHits: 0, activeSpeedMultiplier: DIFFICULTIES[s.difficulty].multiplier,
      ball: { ...s.ball, speed, vx: speed * Math.sin(s.serveAngle), vy: -speed * Math.cos(s.serveAngle) } }
  }
  return s
}
export function step(s: BrickBurstState): { state: BrickBurstState; events: BrickBurstEvent[] } {
  const events: BrickBurstEvent[] = []
  if (s.status === 'paused' || s.status === 'over') return { state: s, events }
  if (s.status === 'ball-lost' || s.status === 'level-clear') {
    const feedbackMs = Math.max(0, s.feedbackMs - STEP_MS)
    if (feedbackMs > 1e-7) return { state: { ...s, feedbackMs }, events }
    if (s.status === 'ball-lost') return { state: { ...s, status: 'serving', feedbackMs: 0, ball: restingBall(s.paddleX, levelSpeed(s.level, s.difficulty)) }, events }
    const level = s.level + 1
    events.push({ type: 'level-started', level })
    return { state: { ...s, ...nextAngle(s.rng), status: 'serving', level, feedbackMs: 0, paddleX: FIELD_WIDTH / 2,
      bricks: bricksForLevel(level), ball: restingBall(FIELD_WIDTH / 2, levelSpeed(level, s.difficulty)), rallyHits: 0 }, events }
  }
  const paddleX = clamp(s.paddleX + s.steer * PADDLE_SPEED * STEP_MS / 1000, PADDLE_W / 2, FIELD_WIDTH - PADDLE_W / 2)
  if (s.status === 'serving') return { state: { ...s, paddleX, ball: restingBall(paddleX, levelSpeed(s.level, s.difficulty)) }, events }
  const ball = { ...s.ball, x: s.ball.x + s.ball.vx * STEP_MS / 1000, y: s.ball.y + s.ball.vy * STEP_MS / 1000 }
  if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); events.push({ type: 'wall-hit', side: 'left' }) }
  if (ball.x > FIELD_WIDTH - BALL_R) { ball.x = FIELD_WIDTH - BALL_R; ball.vx = -Math.abs(ball.vx); events.push({ type: 'wall-hit', side: 'right' }) }
  if (ball.y < BALL_R) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); events.push({ type: 'wall-hit', side: 'top' }) }
  if (ball.vy > 0 && s.ball.y + BALL_R <= PADDLE_TOP && ball.y + BALL_R >= PADDLE_TOP && Math.abs(ball.x - paddleX) <= PADDLE_W / 2 + BALL_R) {
    const offset = clamp((ball.x - paddleX) / (PADDLE_W / 2 + BALL_R), -1, 1)
    const angle = offset * Math.PI / 3
    ball.y = PADDLE_TOP - BALL_R; ball.vx = ball.speed * Math.sin(angle); ball.vy = -ball.speed * Math.cos(angle)
    events.push({ type: 'paddle-hit', x: ball.x, offset })
  }
  // A closest-point test selects one candidate with a stable row/column tie break.
  let hit = -1, closest = Infinity
  for (let i = 0; i < s.bricks.length; i++) {
    if (!s.bricks[i]) continue
    const x = i % COLUMNS * BRICK_W, y = BRICKS_TOP + Math.floor(i / COLUMNS) * BRICK_H
    const dx = ball.x - clamp(ball.x, x, x + BRICK_W), dy = ball.y - clamp(ball.y, y, y + BRICK_H)
    if (dx * dx + dy * dy > BALL_R * BALL_R) continue
    const distance = (ball.x - x - BRICK_W / 2) ** 2 + (ball.y - y - BRICK_H / 2) ** 2
    if (distance < closest) { hit = i; closest = distance }
  }
  let bricks = s.bricks, score = s.score, rallyHits = s.rallyHits
  if (hit !== -1) {
    const brick = bricks[hit]!, row = Math.floor(hit / COLUMNS), col = hit % COLUMNS
    const x = col * BRICK_W, y = BRICKS_TOP + row * BRICK_H
    const overlapX = Math.min(ball.x + BALL_R - x, x + BRICK_W - ball.x + BALL_R)
    const overlapY = Math.min(ball.y + BALL_R - y, y + BRICK_H - ball.y + BALL_R)
    const impactX = ball.x, impactY = ball.y, ballVx = ball.vx, ballVy = ball.vy
    if (overlapX <= overlapY) { ball.x += (ball.x < x + BRICK_W / 2 ? -1 : 1) * (overlapX + 1e-8); ball.vx = -ball.vx }
    if (overlapY <= overlapX) { ball.y += (ball.y < y + BRICK_H / 2 ? -1 : 1) * (overlapY + 1e-8); ball.vy = -ball.vy }
    const broken = brick.kind === 'normal' || brick.damaged
    const points = Math.round((broken ? ROW_POINTS[row] * (brick.kind === 'tough' ? 2 : 1) : 10) * s.activeSpeedMultiplier)
    bricks = [...bricks]; (bricks as (Brick | null)[])[hit] = broken ? null : { ...brick, damaged: true }
    score += points; rallyHits++
    events.push({ type: 'brick-hit', row, col, kind: brick.kind, broken, points, impactX, impactY, ballVx, ballVy })
    if (rallyHits % RALLY_HITS_PER_INCREASE === 0) {
      const base = levelSpeedFor(s.level, s.activeSpeedMultiplier)
      const speed = Math.min(ball.speed * RALLY_SPEED_FACTOR, base * RALLY_SPEED_CAP), factor = speed / ball.speed
      ball.speed = speed; ball.vx *= factor; ball.vy *= factor
    }
  }
  if (ball.y - BALL_R > FIELD_HEIGHT) {
    const lives = s.lives - 1
    events.push({ type: 'ball-lost', livesLeft: lives })
    if (lives === 0) events.push({ type: 'game-over', score })
    return { state: { ...s, ...nextAngle(s.rng), ball: { ...ball, speed: levelSpeed(s.level, s.difficulty) }, paddleX, bricks, score, lives,
      status: lives ? 'ball-lost' : 'over', feedbackMs: lives ? BALL_LOST_MS : 0, rallyHits: 0, steer: 0 }, events }
  }
  if (hit !== -1 && !bricks.some(Boolean)) {
    const bonus = Math.round(500 * s.level * s.activeSpeedMultiplier)
    events.push({ type: 'level-cleared', level: s.level, bonus })
    return { state: { ...s, ball, paddleX, bricks, score: score + bonus, rallyHits, status: 'level-clear', feedbackMs: LEVEL_CLEAR_MS, steer: 0 }, events }
  }
  return { state: { ...s, ball, paddleX, bricks, score, rallyHits }, events }
}
