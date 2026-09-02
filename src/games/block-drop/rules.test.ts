import { describe, expect, it } from 'vitest'
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TETROMINOES,
  applyAction,
  createEmptyBoard,
  createGame,
  getPieceCells,
  restart,
  shuffleBag,
  stepGravity,
  type ActivePiece,
  type BlockDropState,
  type Board,
  type Cell,
  type Tetromino,
} from './rules'

function boardWith(cells: ReadonlyArray<readonly [number, number, Tetromino]>): Board {
  const board = createEmptyBoard().map((row) => [...row])
  for (const [x, y, type] of cells) {
    board[y][x] = type
  }
  return board
}

function stateWith(
  active: ActivePiece,
  board: Board = createEmptyBoard(),
  bag: ReadonlyArray<Tetromino> = ['T'],
): BlockDropState {
  return {
    board,
    active,
    bag,
    randomState: 123,
    initialSeed: 123,
    status: 'playing',
    score: 0,
  }
}

describe('seeded pieces', () => {
  it('shuffles every tetromino into each complete bag', () => {
    const first = shuffleBag(19)
    const second = shuffleBag(first.randomState)

    expect([...first.bag].sort()).toEqual([...TETROMINOES].sort())
    expect([...second.bag].sort()).toEqual([...TETROMINOES].sort())
    expect(new Set(first.bag)).toHaveLength(7)
  })

  it('produces equal states for the same seed and actions', () => {
    const actions = [
      'left',
      'rotate',
      'soft-drop',
      'right',
      'hard-drop',
      'hard-drop',
    ] as const
    const play = () =>
      actions.reduce((state, action) => applyAction(state, action), createGame(42))

    expect(play()).toEqual(play())
  })
})

describe('movement and rotation', () => {
  it('accepts valid horizontal movement and clockwise rotation', () => {
    const initial = stateWith({ type: 'T', rotation: 0, x: 3, y: 2 })
    const movedLeft = applyAction(initial, 'left')
    const movedRight = applyAction(movedLeft, 'right')
    const rotated = applyAction(movedRight, 'rotate')

    expect(movedLeft.active?.x).toBe(2)
    expect(movedRight.active?.x).toBe(3)
    expect(rotated.active?.rotation).toBe(1)
    expect(initial.active).toEqual({ type: 'T', rotation: 0, x: 3, y: 2 })
  })

  it('rejects movement through boundaries and locked cells', () => {
    const atWall = stateWith({ type: 'T', rotation: 0, x: 0, y: 2 })
    const blocked = stateWith(
      { type: 'T', rotation: 0, x: 3, y: 2 },
      boardWith([[6, 3, 'Z']]),
    )

    expect(applyAction(atWall, 'left')).toBe(atWall)
    expect(applyAction(blocked, 'right')).toBe(blocked)
  })

  it('rejects a clockwise rotation outside the board', () => {
    const verticalAtWall = stateWith({ type: 'I', rotation: 1, x: -2, y: 2 })

    expect(applyAction(verticalAtWall, 'rotate')).toBe(verticalAtWall)
  })
})

describe('descent and locking', () => {
  it('moves exactly one row for gravity and soft drop', () => {
    const initial = createGame(8)
    const gravity = stepGravity(initial)
    const soft = applyAction(gravity, 'soft-drop')

    expect(gravity.active?.y).toBe((initial.active?.y ?? 0) + 1)
    expect(soft.active?.y).toBe((initial.active?.y ?? 0) + 2)
    expect(initial.board).toEqual(createEmptyBoard())
  })

  it('hard drops to the lowest position and locks immediately', () => {
    const initial = stateWith({ type: 'O', rotation: 0, x: 3, y: 0 })
    const dropped = applyAction(initial, 'hard-drop')

    expect(dropped.active?.type).toBe('T')
    expect(dropped.board[18][4]).toBe('O')
    expect(dropped.board[19][5]).toBe('O')
  })

  it('locks when a gravity or soft-drop step cannot descend', () => {
    const initial = stateWith({ type: 'O', rotation: 0, x: 3, y: 18 })
    const gravity = stepGravity(initial)
    const soft = applyAction(initial, 'soft-drop')

    expect(gravity.board[19][4]).toBe('O')
    expect(soft).toEqual(gravity)
  })

  it('clears multiple completed rows simultaneously', () => {
    const rows = createEmptyBoard().map((row) => [...row])
    for (const y of [18, 19]) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        if (x !== 4 && x !== 5) rows[y][x] = 'J'
      }
    }
    const initial = stateWith(
      { type: 'O', rotation: 0, x: 3, y: 18 },
      rows,
    )
    const cleared = stepGravity(initial)

    expect(cleared.board.flat().every((cell) => cell === null)).toBe(true)
    expect(cleared.board).toHaveLength(BOARD_HEIGHT)
  })
})

describe('scoring', () => {
  it('starts at zero and awards only successful manual drop rows', () => {
    const initial = createGame(8)
    const gravity = stepGravity(initial)
    const soft = applyAction(gravity, 'soft-drop')
    const blocked = stateWith({ type: 'O', rotation: 0, x: 3, y: 18 })

    expect(initial.score).toBe(0)
    expect(gravity.score).toBe(0)
    expect(soft.score).toBe(1)
    expect(applyAction(blocked, 'soft-drop').score).toBe(0)
  })

  it('awards two points for each hard-drop row', () => {
    const initial = stateWith({ type: 'O', rotation: 0, x: 3, y: 0 })

    expect(applyAction(initial, 'hard-drop').score).toBe(36)
  })

  it.each([
    [1, 100],
    [2, 300],
    [3, 500],
    [4, 800],
  ])('awards %i simultaneous line clears exactly %i points', (count, award) => {
    const rows = createEmptyBoard().map((row) => [...row])
    for (let y = BOARD_HEIGHT - count; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        if (x !== 4) rows[y][x] = 'J'
      }
    }
    const initial = stateWith(
      { type: 'I', rotation: 1, x: 2, y: 16 },
      rows,
    )

    expect(stepGravity(initial).score).toBe(award)
  })

  it('adds hard-drop and line-clear points in the same transition', () => {
    const rows = createEmptyBoard().map((row) => [...row])
    for (let y = 16; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        if (x !== 4) rows[y][x] = 'J'
      }
    }
    const initial = stateWith(
      { type: 'I', rotation: 1, x: 2, y: 0 },
      rows,
    )

    expect(applyAction(initial, 'hard-drop').score).toBe(832)
  })

  it('preserves soft-drop points when the following lock clears lines', () => {
    const rows = createEmptyBoard().map((row) => [...row])
    for (let y = 16; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        if (x !== 4) rows[y][x] = 'J'
      }
    }
    const initial = stateWith(
      { type: 'I', rotation: 1, x: 2, y: 15 },
      rows,
    )
    const softDropped = applyAction(initial, 'soft-drop')

    expect(softDropped.score).toBe(1)
    expect(applyAction(softDropped, 'soft-drop').score).toBe(801)
  })
})

describe('game lifecycle', () => {
  it('ends the game when the next piece cannot spawn and ignores gameplay', () => {
    const next: ActivePiece = { type: 'T', rotation: 0, x: 3, y: 0 }
    const spawnCell = getPieceCells(next)[0]
    const initial = {
      ...stateWith(
        { type: 'O', rotation: 0, x: 3, y: 18 },
        boardWith([[spawnCell.x, spawnCell.y, 'Z']]),
        ['T'],
      ),
      score: 321,
    }
    const gameOver = stepGravity(initial)

    expect(gameOver.status).toBe('game-over')
    expect(gameOver.score).toBe(initial.score)
    expect(gameOver.active).toBeNull()
    expect(stepGravity(gameOver)).toBe(gameOver)
    expect(applyAction(gameOver, 'left')).toBe(gameOver)
  })

  it('restarts with a fresh empty board and active piece', () => {
    const playing = createGame(77)
    const dirty = applyAction(playing, 'hard-drop')
    expect(dirty.score).toBeGreaterThan(0)
    const gameOver: BlockDropState = {
      ...dirty,
      active: null,
      status: 'game-over',
    }
    const fresh = restart(gameOver)

    expect(fresh).toEqual(createGame(77))
    expect(fresh.board.flat()).toEqual(
      Array<Cell>(BOARD_WIDTH * BOARD_HEIGHT).fill(null),
    )
    expect(fresh.active).not.toBeNull()
    expect(fresh.status).toBe('playing')
    expect(fresh.score).toBe(0)
    expect(applyAction(gameOver, 'restart')).toEqual(fresh)
  })
})
