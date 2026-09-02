export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20

export const TETROMINOES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as const

export type Tetromino = (typeof TETROMINOES)[number]
export type Cell = Tetromino | null
export type Board = ReadonlyArray<ReadonlyArray<Cell>>
export type GameStatus = 'playing' | 'game-over'
export type GameAction =
  | 'left'
  | 'right'
  | 'rotate'
  | 'soft-drop'
  | 'hard-drop'
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
  readonly bag: ReadonlyArray<Tetromino>
  readonly randomState: number
  readonly initialSeed: number
  readonly status: GameStatus
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
    return SHAPES.O
  }

  let cells = SHAPES[type]
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

function spawnPiece(type: Tetromino): ActivePiece {
  return {
    type,
    rotation: 0,
    x: Math.floor((BOARD_WIDTH - SHAPE_SIZE[type]) / 2),
    y: 0,
  }
}

function drawPiece(state: BlockDropState): {
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
  const active = spawnPiece(drawn.type)
  const next = {
    ...state,
    active,
    bag: drawn.bag,
    randomState: drawn.randomState,
  }

  return isValidPiece(next.board, active)
    ? next
    : { ...next, active: null, status: 'game-over' }
}

export function createGame(seed: number): BlockDropState {
  return spawnNext({
    board: createEmptyBoard(),
    active: null,
    bag: [],
    randomState: seed >>> 0,
    initialSeed: seed >>> 0,
    status: 'playing',
  })
}

function clearFullRows(board: Board): Board {
  const remaining = board.filter((row) => row.some((cell) => cell === null))
  const cleared = BOARD_HEIGHT - remaining.length
  return [
    ...Array.from({ length: cleared }, () =>
      Array<Cell>(BOARD_WIDTH).fill(null),
    ),
    ...remaining,
  ]
}

function lockActive(state: BlockDropState): BlockDropState {
  if (state.active === null) {
    return state
  }

  const board = state.board.map((row) => [...row])
  for (const { x, y } of getPieceCells(state.active)) {
    board[y][x] = state.active.type
  }

  return spawnNext({
    ...state,
    board: clearFullRows(board),
    active: null,
  })
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

export function stepGravity(state: BlockDropState): BlockDropState {
  if (state.status === 'game-over' || state.active === null) {
    return state
  }
  const moved = tryActive(state, (piece) => ({ ...piece, y: piece.y + 1 }))
  return moved === state ? lockActive(state) : moved
}

function hardDrop(state: BlockDropState): BlockDropState {
  if (state.active === null) {
    return state
  }

  let dropped = state
  while (true) {
    const moved = tryActive(dropped, (piece) => ({ ...piece, y: piece.y + 1 }))
    if (moved === dropped) {
      return lockActive(dropped)
    }
    dropped = moved
  }
}

export function restart(state: BlockDropState): BlockDropState {
  return createGame(state.initialSeed)
}

export function applyAction(
  state: BlockDropState,
  action: GameAction,
): BlockDropState {
  if (action === 'restart') {
    return restart(state)
  }
  if (state.status === 'game-over') {
    return state
  }

  switch (action) {
    case 'left':
      return tryActive(state, (piece) => ({ ...piece, x: piece.x - 1 }))
    case 'right':
      return tryActive(state, (piece) => ({ ...piece, x: piece.x + 1 }))
    case 'rotate':
      return tryActive(state, (piece) => ({
        ...piece,
        rotation: (piece.rotation + 1) % 4,
      }))
    case 'soft-drop':
      return stepGravity(state)
    case 'hard-drop':
      return hardDrop(state)
  }
}
