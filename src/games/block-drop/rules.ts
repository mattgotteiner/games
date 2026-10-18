export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20

export const TETROMINOES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as const

export type Tetromino = (typeof TETROMINOES)[number]
export type Cell = Tetromino | null
export type Board = ReadonlyArray<ReadonlyArray<Cell>>
export type GameStatus = 'playing' | 'paused' | 'game-over'
export type GameAction =
  | 'left'
  | 'right'
  | 'rotate'
  | 'soft-drop'
  | 'hard-drop'
  | 'pause'
  | 'restart'

export interface ActivePiece {
  readonly type: Tetromino
  readonly rotation: number
  readonly x: number
  readonly y: number
}

export interface BlockDropState {
  readonly board: Board
  readonly active: ActivePiece | null
  readonly next: Tetromino
  readonly bag: ReadonlyArray<Tetromino>
  readonly randomState: number
  readonly initialSeed: number
  readonly status: GameStatus
  readonly difficulty: BlockDropDifficulty
  readonly score: number
  readonly lines: number
  readonly level: number
}

export const BLOCK_DROP_DIFFICULTY_ORDER = ['easy', 'medium', 'hard'] as const
export type BlockDropDifficulty = (typeof BLOCK_DROP_DIFFICULTY_ORDER)[number]

export const BLOCK_DROP_DIFFICULTIES: Readonly<
  Record<
    BlockDropDifficulty,
    {
      readonly label: string
      readonly speed: number
      readonly description: string
    }
  >
> = Object.freeze({
  easy: Object.freeze({ label: 'Easy', speed: 0.5, description: 'Half speed' }),
  medium: Object.freeze({ label: 'Medium', speed: 1, description: 'Normal speed' }),
  hard: Object.freeze({ label: 'Hard', speed: 1.5, description: '1.5× speed' }),
})

export interface LineClearEvent {
  readonly rows: ReadonlyArray<number>
  readonly board: Board
  readonly points: number
}

export interface BlockDropTransition {
  readonly state: BlockDropState
  readonly lineClear?: LineClearEvent
}

export interface Point {
  readonly x: number
  readonly y: number
}

const SHAPES: Readonly<Record<Tetromino, ReadonlyArray<Point>>> = {
  I: [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
  ],
  J: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  L: [
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  O: [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  S: [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  T: [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  Z: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
}

export function getInitialPieceCells(type: Tetromino): ReadonlyArray<Point> {
  return SHAPES[type]
}

const SHAPE_SIZE: Readonly<Record<Tetromino, number>> = {
  I: 4,
  J: 3,
  L: 3,
  O: 4,
  S: 3,
  T: 3,
  Z: 3,
}

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array<Cell>(BOARD_WIDTH).fill(null),
  )
}

function nextRandom(randomState: number): readonly [number, number] {
  const nextState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0
  return [nextState / 0x100000000, nextState]
}

export function shuffleBag(seed: number): {
  readonly bag: ReadonlyArray<Tetromino>
  readonly randomState: number
} {
  const bag = [...TETROMINOES]
  let randomState = seed >>> 0

  for (let index = bag.length - 1; index > 0; index -= 1) {
    const [random, nextState] = nextRandom(randomState)
    randomState = nextState
    const swapIndex = Math.floor(random * (index + 1))
    const value = bag[index]
    bag[index] = bag[swapIndex]
    bag[swapIndex] = value
  }

  return { bag, randomState }
}

function rotatedCells(type: Tetromino, rotation: number): ReadonlyArray<Point> {
  if (type === 'O') {
    return getInitialPieceCells(type)
  }

  let cells = getInitialPieceCells(type)
  const size = SHAPE_SIZE[type]
  for (let turn = 0; turn < rotation % 4; turn += 1) {
    cells = cells.map(({ x, y }) => ({ x: size - 1 - y, y: x }))
  }
  return cells
}

export function getPieceCells(piece: ActivePiece): ReadonlyArray<Point> {
  return rotatedCells(piece.type, piece.rotation).map(({ x, y }) => ({
    x: piece.x + x,
    y: piece.y + y,
  }))
}

export function isValidPiece(board: Board, piece: ActivePiece): boolean {
  return getPieceCells(piece).every(
    ({ x, y }) =>
      x >= 0 &&
      x < BOARD_WIDTH &&
      y >= 0 &&
      y < BOARD_HEIGHT &&
      board[y]?.[x] === null,
  )
}

export function getLandingPiece(
  state: Pick<BlockDropState, 'board' | 'active'>,
): ActivePiece | null {
  if (state.active === null) return null

  let landing = state.active
  while (true) {
    const next = { ...landing, y: landing.y + 1 }
    if (!isValidPiece(state.board, next)) return landing
    landing = next
  }
}

function spawnPiece(type: Tetromino): ActivePiece {
  return {
    type,
    rotation: 0,
    x: Math.floor((BOARD_WIDTH - SHAPE_SIZE[type]) / 2),
    y: 0,
  }
}

function drawPiece(
  state: Pick<BlockDropState, 'bag' | 'randomState'>,
): {
  readonly type: Tetromino
  readonly bag: ReadonlyArray<Tetromino>
  readonly randomState: number
} {
  let bag = state.bag
  let randomState = state.randomState

  if (bag.length === 0) {
    const shuffled = shuffleBag(randomState)
    bag = shuffled.bag
    randomState = shuffled.randomState
  }

  const [type, ...remaining] = bag
  return { type: type as Tetromino, bag: remaining, randomState }
}

function spawnNext(state: BlockDropState): BlockDropState {
  const drawn = drawPiece(state)
  const active = spawnPiece(state.next)
  const next = {
    ...state,
    active,
    next: drawn.type,
    bag: drawn.bag,
    randomState: drawn.randomState,
  }

  return isValidPiece(next.board, active)
    ? next
    : { ...next, active: null, status: 'game-over' }
}

export function createGame(
  seed: number,
  difficulty: BlockDropDifficulty = 'medium',
): BlockDropState {
  const first = drawPiece({ bag: [], randomState: seed >>> 0 })
  return spawnNext({
    board: createEmptyBoard(),
    active: null,
    next: first.type,
    bag: first.bag,
    randomState: first.randomState,
    initialSeed: seed >>> 0,
    status: 'playing',
    difficulty,
    score: 0,
    lines: 0,
    level: 1,
  })
}

export const BLOCK_DROP_SCORING = Object.freeze({
  gravityPerRow: 0,
  softDropPerRow: 1,
  hardDropPerRow: 2,
  lineClears: Object.freeze<Record<number, number>>({
    1: 100,
    2: 300,
    3: 500,
    4: 800,
  }),
})

export function getGravityInterval(
  level: number,
  difficulty: BlockDropDifficulty = 'medium',
): number {
  const speed = BLOCK_DROP_DIFFICULTIES[difficulty].speed
  return Math.max(80, Math.round((700 * 0.85 ** (level - 1)) / speed))
}

function clearFullRows(board: Board): {
  readonly board: Board
  readonly completedRows: ReadonlyArray<number>
} {
  const completedRows = board.flatMap((row, y) =>
    row.every((cell) => cell !== null) ? [y] : [],
  )
  const remaining = board.filter((row) => row.some((cell) => cell === null))
  return {
    board: [
      ...Array.from({ length: completedRows.length }, () =>
        Array<Cell>(BOARD_WIDTH).fill(null),
      ),
      ...remaining,
    ],
    completedRows,
  }
}

function transition(state: BlockDropState): BlockDropTransition {
  return { state }
}

function lockActive(state: BlockDropState): BlockDropTransition {
  if (state.active === null) {
    return transition(state)
  }

  const board = state.board.map((row) => [...row])
  for (const { x, y } of getPieceCells(state.active)) {
    board[y][x] = state.active.type
  }
  const cleared = clearFullRows(board)
  const clearPoints =
    (BLOCK_DROP_SCORING.lineClears[cleared.completedRows.length] ?? 0) *
    state.level *
    BLOCK_DROP_DIFFICULTIES[state.difficulty].speed
  const lines = state.lines + cleared.completedRows.length
  const nextState = spawnNext({
    ...state,
    board: cleared.board,
    active: null,
    score: state.score + clearPoints,
    lines,
    level: Math.floor(lines / 10) + 1,
  })

  return cleared.completedRows.length === 0
    ? transition(nextState)
    : {
        state: nextState,
        lineClear: {
          rows: cleared.completedRows,
          board,
          points: clearPoints,
        },
      }
}

function tryActive(
  state: BlockDropState,
  update: (piece: ActivePiece) => ActivePiece,
): BlockDropState {
  if (state.active === null) {
    return state
  }
  const active = update(state.active)
  return isValidPiece(state.board, active) ? { ...state, active } : state
}

export function stepGravityWithEvents(
  state: BlockDropState,
): BlockDropTransition {
  if (state.status !== 'playing' || state.active === null) {
    return transition(state)
  }
  const moved = tryActive(state, (piece) => ({ ...piece, y: piece.y + 1 }))
  return moved === state ? lockActive(state) : transition(moved)
}

export function stepGravity(state: BlockDropState): BlockDropState {
  return stepGravityWithEvents(state).state
}

function hardDrop(state: BlockDropState): BlockDropTransition {
  const landing = getLandingPiece(state)
  if (landing === null || state.active === null) return transition(state)

  return lockActive({
    ...state,
    active: landing,
    score:
      state.score +
      (landing.y - state.active.y) *
        BLOCK_DROP_SCORING.hardDropPerRow *
        BLOCK_DROP_DIFFICULTIES[state.difficulty].speed,
  })
}

function softDrop(state: BlockDropState): BlockDropTransition {
  const moved = tryActive(state, (piece) => ({ ...piece, y: piece.y + 1 }))
  return moved === state
    ? lockActive(state)
    : transition({
        ...moved,
        score:
          state.score +
          BLOCK_DROP_SCORING.softDropPerRow *
            BLOCK_DROP_DIFFICULTIES[state.difficulty].speed,
      })
}

export function restart(state: BlockDropState): BlockDropState {
  return { ...createGame(state.initialSeed), difficulty: state.difficulty }
}

export function setDifficulty(
  state: BlockDropState,
  difficulty: BlockDropDifficulty,
): BlockDropState {
  if (state.status !== 'paused' || state.difficulty === difficulty) return state
  return { ...state, difficulty }
}

export function applyAction(
  state: BlockDropState,
  action: GameAction,
): BlockDropState {
  return applyActionWithEvents(state, action).state
}

export function applyActionWithEvents(
  state: BlockDropState,
  action: GameAction,
): BlockDropTransition {
  if (action === 'restart') {
    return transition(restart(state))
  }
  if (action === 'pause') {
    if (state.status === 'game-over') return transition(state)
    return transition({
      ...state,
      status: state.status === 'playing' ? 'paused' : 'playing',
    })
  }
  if (state.status === 'paused') {
    return transition(state)
  }
  if (state.status === 'game-over') {
    return transition(state)
  }

  switch (action) {
    case 'left':
      return transition(
        tryActive(state, (piece) => ({ ...piece, x: piece.x - 1 })),
      )
    case 'right':
      return transition(
        tryActive(state, (piece) => ({ ...piece, x: piece.x + 1 })),
      )
    case 'rotate':
      return transition(
        tryActive(state, (piece) => ({
          ...piece,
          rotation: (piece.rotation + 1) % 4,
        })),
      )
    case 'soft-drop':
      return softDrop(state)
    case 'hard-drop':
      return hardDrop(state)
  }
}
