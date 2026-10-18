import { describe, expect, it } from 'vitest'
import {
  BLOCK_DROP_SCORING,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TETROMINOES,
  applyAction,
  applyActionWithEvents,
  createEmptyBoard,
  createGame,
  getGravityInterval,
  getLandingPiece,
  getInitialPieceCells,
  getPieceCells,
  isValidPiece,
  restart,
  shuffleBag,
  stepGravity,
  stepGravityWithEvents,
  setDifficulty,
  type ActivePiece,
  type BlockDropDifficulty,
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
  next: Tetromino = 'T',
  difficulty: BlockDropDifficulty = 'medium',
): BlockDropState {
  return {
    board,
    active,
    next,
    heldPiece: null,
    holdUsed: false,
    bag,
    randomState: 123,
    initialSeed: 123,
    status: 'playing',
    difficulty,
    score: 0,
    lines: 0,
    level: 1,
  }
}

function lineClearState(
  clearedLines: number,
  lines = 0,
  difficulty: BlockDropDifficulty = 'medium',
): BlockDropState {
  const board = createEmptyBoard().map((row) => [...row])
  const gaps = new Map<number, ReadonlyArray<number>>()
  let active: ActivePiece

  if (clearedLines === 1) {
    gaps.set(19, [4, 5])
    active = { type: 'O', rotation: 0, x: 3, y: 18 }
  } else if (clearedLines === 2) {
    gaps.set(18, [4, 5])
    gaps.set(19, [4, 5])
    active = { type: 'O', rotation: 0, x: 3, y: 18 }
  } else if (clearedLines === 3) {
    gaps.set(17, [4])
    gaps.set(18, [4, 5])
    gaps.set(19, [4])
    active = { type: 'T', rotation: 1, x: 3, y: 17 }
  } else {
    for (let y = 16; y < BOARD_HEIGHT; y += 1) gaps.set(y, [5])
    active = { type: 'I', rotation: 1, x: 3, y: 16 }
  }

  for (const [y, emptyColumns] of gaps) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      if (!emptyColumns.includes(x)) board[y][x] = 'J'
    }
  }

  return {
    ...stateWith(active, board),
    difficulty,
    lines,
    level: Math.floor(lines / 10) + 1,
  }
}

describe('level progression', () => {
  it('starts at level one with no lines cleared', () => {
    expect(createGame(8)).toMatchObject({ level: 1, lines: 0 })
  })

  it('defaults to Medium and accepts an initial difficulty preference', () => {
    expect(createGame(8).difficulty).toBe('medium')
    expect(createGame(8, 'hard').difficulty).toBe('hard')
  })

  it.each([
    [1, 700],
    [2, 595],
    [10, 162],
    [14, 85],
    [15, 80],
    [30, 80],
  ])('uses the gravity curve at level %i', (level, milliseconds) => {
    expect(getGravityInterval(level)).toBe(milliseconds)
  })

  it.each([1, 2, 3, 4])(
    'multiplies a %i-line clear by the level before the clear',
    (clearedLines) => {
      for (const level of [1, 3]) {
        const initialLines = level === 1 ? 0 : 20
        const initial = lineClearState(clearedLines, initialLines)
        const result = applyActionWithEvents(initial, 'hard-drop')
        const basePoints = BLOCK_DROP_SCORING.lineClears[clearedLines]

        expect(result.lineClear?.rows).toHaveLength(clearedLines)
        expect(result.lineClear?.points).toBe(basePoints * level)
        expect(result.state.score).toBe(basePoints * level)
        expect(result.state.lines).toBe(initialLines + clearedLines)
        expect(result.state.level).toBe(
          Math.floor((initialLines + clearedLines) / 10) + 1,
        )
      }
    },
  )

  it('scores a level-crossing clear with the level before the clear', () => {
    const result = applyActionWithEvents(lineClearState(2, 9), 'hard-drop')

    expect(result.lineClear?.points).toBe(300)
    expect(result.state.score).toBe(300)
    expect(result.state.lines).toBe(11)
    expect(result.state.level).toBe(2)
  })

  it('replays line-count and level transitions deterministically', () => {
    const paused = applyAction(lineClearState(2, 9), 'pause')
    const initial = setDifficulty(paused, 'hard')
    const resumed = applyAction(initial, 'pause')
    const replay = () => applyActionWithEvents(resumed, 'hard-drop').state

    expect(replay()).toEqual(replay())
    expect(replay()).toMatchObject({ lines: 11, level: 2, difficulty: 'hard' })
    expect(replay().score).toBe(450)
  })

  it.each([
    [9, 1, 10, 2],
    [19, 1, 20, 3],
  ])('advances from %i lines to level %i at the next tenth line', (
    initialLines,
    clearedLines,
    totalLines,
    expectedLevel,
  ) => {
    const result = applyActionWithEvents(
      lineClearState(clearedLines, initialLines),
      'hard-drop',
    )

    expect(result.state.lines).toBe(totalLines)
    expect(result.state.level).toBe(expectedLevel)
  })

  it('keeps soft-drop and hard-drop distance points unchanged at higher levels', () => {
    const levelThree = {
      ...createGame(8),
      lines: 20,
      level: 3,
    }

    expect(applyAction(levelThree, 'soft-drop').score).toBe(1)
    const landing = getLandingPiece(levelThree)!
    const hardDropped = applyAction(levelThree, 'hard-drop')
    const landingRows = landing.y - (levelThree.active?.y ?? 0)
    expect(hardDropped.score).toBe(landingRows * 2)
  })
})

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

  it('promotes the exact preview and stays seeded across a bag boundary', () => {
    let state = createGame(42)
    const active: Tetromino[] = []
    const previews: Tetromino[] = []

    for (let index = 0; index < 9; index += 1) {
      active.push(state.active?.type as Tetromino)
      previews.push(state.next)
      state = applyAction({ ...state, board: createEmptyBoard() }, 'hard-drop')
    }

    expect(active).toEqual(['S', 'O', 'Z', 'T', 'L', 'I', 'J', 'J', 'T'])
    expect(previews).toEqual(['O', 'Z', 'T', 'L', 'I', 'J', 'J', 'T', 'L'])
    expect(active.slice(1)).toEqual(previews.slice(0, -1))
  })

  it('exposes each initial piece as four local cells in a four-cell square', () => {
    for (const type of TETROMINOES) {
      const cells = getInitialPieceCells(type)
      expect(cells).toHaveLength(4)
      expect(cells.every(({ x, y }) => x >= 0 && x < 4 && y >= 0 && y < 4)).toBe(
        true,
      )
    }
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

  it.each([
    {
      edge: 'left wall in rotation 1',
      active: { type: 'I', rotation: 1, x: -2, y: 4 } as const,
      expectedX: 0,
    },
    {
      edge: 'right wall in rotation 1',
      active: { type: 'I', rotation: 1, x: 7, y: 4 } as const,
      expectedX: 6,
    },
    {
      edge: 'left wall in rotation 3',
      active: { type: 'I', rotation: 3, x: -1, y: 4 } as const,
      expectedX: 0,
    },
    {
      edge: 'right wall in rotation 3',
      active: { type: 'I', rotation: 3, x: 8, y: 4 } as const,
      expectedX: 6,
    },
  ])('kicks an I piece away from the $edge', ({ active, expectedX }) => {
    const initial = stateWith(active)
    const rotated = applyAction(initial, 'rotate')

    expect(rotated.active).toEqual({
      ...active,
      rotation: (active.rotation + 1) % 4,
      x: expectedX,
    })
    expect(isValidPiece(rotated.board, rotated.active!)).toBe(true)
  })

  it.each([
    {
      edge: 'left wall',
      active: { type: 'T', rotation: 0, x: 0, y: 4 } as const,
      blocker: [1, 6, 'Z'] as const,
      expectedX: 1,
    },
    {
      edge: 'right wall',
      active: { type: 'T', rotation: 0, x: 7, y: 4 } as const,
      blocker: [8, 6, 'Z'] as const,
      expectedX: 6,
    },
  ])('kicks a T piece away from the $edge', ({ active, blocker, expectedX }) => {
    const initial = stateWith(active, boardWith([blocker]))
    const rotated = applyAction(initial, 'rotate')

    expect(rotated.active).toEqual({
      ...active,
      rotation: 1,
      x: expectedX,
    })
    expect(isValidPiece(rotated.board, rotated.active!)).toBe(true)
  })

  it('kicks a J piece away from a nearby stack', () => {
    const active = { type: 'J', rotation: 0, x: 4, y: 4 } as const
    const initial = stateWith(
      active,
      boardWith([
        [5, 3, 'Z'],
        [5, 4, 'Z'],
      ]),
    )
    const rotated = applyAction(initial, 'rotate')

    expect(rotated.active).toEqual({ ...active, rotation: 1, x: 5 })
    expect(isValidPiece(rotated.board, rotated.active!)).toBe(true)
  })

  it('keeps a rotation in place when every kick offset collides', () => {
    const active = { type: 'T', rotation: 0, x: 3, y: 5 } as const
    const occupied = new Set(
      getPieceCells(active).map(({ x, y }) => `${x},${y}`),
    )
    const board: Board = createEmptyBoard().map((row, y) =>
      row.map((_, x): Cell => (occupied.has(`${x},${y}`) ? null : 'Z')),
    )
    const initial = stateWith(active, board)

    expect(isValidPiece(board, active)).toBe(true)
    expect(applyAction(initial, 'rotate')).toBe(initial)
  })

  it('keeps O-piece rotation unchanged', () => {
    const initial = stateWith({ type: 'O', rotation: 0, x: 3, y: 5 })

    expect(applyAction(initial, 'rotate')).toBe(initial)
  })
})

describe('hold piece', () => {
  it.each(['easy', 'medium', 'hard'] as const)(
    'allows hold at %s difficulty',
    (difficulty) => {
      const initial = createGame(812, difficulty)
      const held = applyAction(initial, 'hold')

      expect(held.heldPiece).toBe(initial.active?.type)
      expect(held.holdUsed).toBe(true)
      expect(held.difficulty).toBe(difficulty)
    },
  )

  it('stores the active piece and promotes the queued piece when the slot is empty', () => {
    const initial = stateWith(
      { type: 'T', rotation: 2, x: 5, y: 7 },
      createEmptyBoard(),
      ['L', 'S'],
      'J',
    )
    const held = applyAction(initial, 'hold')

    expect(held).toMatchObject({
      heldPiece: 'T',
      holdUsed: true,
      active: { type: 'J', rotation: 0, x: 3, y: 0 },
      next: 'L',
      bag: ['S'],
      score: initial.score,
      lines: initial.lines,
      level: initial.level,
      difficulty: initial.difficulty,
    })
    expect(held.board).toBe(initial.board)
  })

  it('swaps with the held piece without consuming the queue', () => {
    const initial = {
      ...stateWith(
        { type: 'T', rotation: 3, x: 5, y: 7 },
        createEmptyBoard(),
        ['L', 'S'],
        'J',
      ),
      heldPiece: 'O' as const,
    }
    const held = applyAction(initial, 'hold')

    expect(held).toMatchObject({
      heldPiece: 'T',
      holdUsed: true,
      active: { type: 'O', rotation: 0, x: 3, y: 0 },
      next: 'J',
      bag: ['L', 'S'],
      randomState: initial.randomState,
      score: initial.score,
    })
    expect(held.board).toBe(initial.board)
  })

  it('allows only one hold before the active piece locks', () => {
    const initial = stateWith(
      { type: 'T', rotation: 0, x: 3, y: 4 },
      createEmptyBoard(),
      ['L', 'S'],
      'J',
    )
    const held = applyAction(initial, 'hold')

    expect(applyAction(held, 'hold')).toBe(held)
  })

  it('resets hold availability when the next piece spawns', () => {
    const initial = {
      ...stateWith(
        { type: 'O', rotation: 0, x: 3, y: 18 },
        createEmptyBoard(),
        ['L', 'S'],
        'J',
      ),
      heldPiece: 'T' as const,
      holdUsed: true,
    }
    const locked = stepGravity(initial)

    expect(locked).toMatchObject({
      active: { type: 'J', rotation: 0 },
      heldPiece: 'T',
      holdUsed: false,
    })
  })

  it('ends the game when a held piece cannot spawn', () => {
    const incoming: ActivePiece = { type: 'O', rotation: 0, x: 3, y: 0 }
    const spawnCell = getPieceCells(incoming)[0]
    const initial = {
      ...stateWith(
        { type: 'T', rotation: 0, x: 3, y: 10 },
        boardWith([[spawnCell.x, spawnCell.y, 'Z']]),
      ),
      heldPiece: 'O' as const,
    }

    expect(applyAction(initial, 'hold')).toMatchObject({
      active: null,
      status: 'game-over',
      heldPiece: 'T',
      holdUsed: true,
    })
  })

  it('replays hold actions deterministically', () => {
    const replay = () => {
      let state = createGame(821)
      state = applyAction(state, 'hold')
      state = applyAction(state, 'hard-drop')
      return applyAction(state, 'hold')
    }

    expect(replay()).toEqual(replay())
  })
})

describe('landing position', () => {
  it.each(TETROMINOES)('finds the lowest %s on an empty board', (type) => {
    const active = { type, rotation: 0, x: 3, y: 0 } satisfies ActivePiece

    expect(getLandingPiece({ board: createEmptyBoard(), active })).toEqual({
      ...active,
      y: 18,
    })
  })

  it.each(TETROMINOES)('finds the %s landing point over uneven cells', (type) => {
    const board = boardWith([
      [4, 16, 'J'],
      [6, 18, 'L'],
    ])
    const active = { type, rotation: 0, x: 3, y: 0 } satisfies ActivePiece
    const landing = getLandingPiece({ board, active })

    expect(landing).toEqual({ ...active, y: 14 })
    expect(isValidPiece(board, landing!)).toBe(true)
    expect(isValidPiece(board, { ...landing!, y: landing!.y + 1 })).toBe(false)
  })

  it.each(TETROMINOES)('keeps a resting %s piece at its current position', (type) => {
    const active = { type, rotation: 0, x: 3, y: 18 } satisfies ActivePiece

    expect(getLandingPiece({ board: createEmptyBoard(), active })).toEqual(active)
  })

  it('returns null when no active piece is present', () => {
    expect(
      getLandingPiece({ ...createGame(41), active: null }),
    ).toBeNull()
  })

  it('locks the exact landing cells after seeded random movement sequences', () => {
    for (let seed = 0; seed < 64; seed += 1) {
      let state = createGame(seed)
      let random = seed + 1
      for (let index = 0; index < 24; index += 1) {
        random = (Math.imul(random, 1664525) + 1013904223) >>> 0
        const action = (['left', 'right', 'rotate'] as const)[random % 3]
        state = applyAction(state, action)
      }

      const active = state.active
      const landing = getLandingPiece(state)
      expect(active).not.toBeNull()
      expect(landing).not.toBeNull()

      const expectedBoard = state.board.map((row) => [...row])
      for (const { x, y } of getPieceCells(landing!)) {
        expectedBoard[y][x] = landing!.type
      }
      const dropped = applyAction(state, 'hard-drop')

      expect(dropped.board).toEqual(expectedBoard)
      expect(dropped.score).toBe(
        state.score +
          (landing!.y - active!.y) * BLOCK_DROP_SCORING.hardDropPerRow,
      )
    }
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

  it('reports exact completed rows with the board before collapse', () => {
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

    const result = stepGravityWithEvents(initial)

    expect(result.lineClear?.rows).toEqual([18, 19])
    expect(result.lineClear?.board[18].every((cell) => cell !== null)).toBe(true)
    expect(result.lineClear?.board[19].every((cell) => cell !== null)).toBe(true)
    expect(result.state).toEqual(stepGravity(initial))
    expect(result.state.score).toBe(300)
  })

  it('omits clear metadata for transitions that do not complete a row', () => {
    const initial = createGame(8)

    expect(stepGravityWithEvents(initial)).toEqual({
      state: stepGravity(initial),
    })
    expect(applyActionWithEvents(initial, 'hard-drop').lineClear).toBeUndefined()
  })
})

describe('scoring', () => {
  it('exposes the immutable scoring definition used by the game', () => {
    expect(BLOCK_DROP_SCORING).toEqual({
      gravityPerRow: 0,
      softDropPerRow: 1,
      hardDropPerRow: 2,
      lineClears: { 1: 100, 2: 300, 3: 500, 4: 800 },
    })
    expect(Object.isFrozen(BLOCK_DROP_SCORING)).toBe(true)
    expect(Object.isFrozen(BLOCK_DROP_SCORING.lineClears)).toBe(true)
  })

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

  it.each([
    ['easy', 0.5],
    ['medium', 1],
    ['hard', 1.5],
  ] as const)(
    'multiplies soft-drop points by the %s difficulty setting',
    (difficulty, points) => {
      const initial = stateWith(
        { type: 'O', rotation: 0, x: 3, y: 0 },
        createEmptyBoard(),
        ['T'],
        'T',
        difficulty,
      )

      expect(applyAction(initial, 'soft-drop').score).toBe(points)
      expect(stepGravity(initial).score).toBe(0)
    },
  )

  it('awards two points for each hard-drop row', () => {
    const initial = stateWith({ type: 'O', rotation: 0, x: 3, y: 0 })

    expect(applyAction(initial, 'hard-drop').score).toBe(36)
  })

  it.each([
    ['easy', 18],
    ['medium', 36],
    ['hard', 54],
  ] as const)(
    'multiplies hard-drop points by the %s difficulty setting',
    (difficulty, points) => {
      const initial = stateWith(
        { type: 'O', rotation: 0, x: 3, y: 0 },
        createEmptyBoard(),
        ['T'],
        'T',
        difficulty,
      )

      expect(applyAction(initial, 'hard-drop').score).toBe(points)
    },
  )

  it.each([
    ['easy', 100],
    ['medium', 200],
    ['hard', 300],
  ] as const)(
    'multiplies line-clear points by level and %s difficulty',
    (difficulty, points) => {
      const initial = lineClearState(1, 10, difficulty)
      const result = applyActionWithEvents(initial, 'hard-drop')

      expect(result.lineClear?.points).toBe(points)
      expect(result.state.score).toBe(points)
      expect(result.state.level).toBe(2)
    },
  )

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
  it('toggles pause deterministically and freezes every gameplay transition', () => {
    const playing = { ...createGame(77), score: 12 }
    const paused = applyAction(playing, 'pause')

    expect(paused).toEqual({ ...playing, status: 'paused' })
    for (const action of [
      'left',
      'right',
      'rotate',
      'soft-drop',
      'hard-drop',
      'hold',
    ] as const) {
      expect(applyAction(paused, action)).toBe(paused)
    }
    expect(stepGravity(paused)).toBe(paused)
    expect(applyAction(paused, 'pause')).toEqual(playing)
  })

  it('restarts from pause into the deterministic initial state', () => {
    const initial = createGame(77)
    const changed = applyAction(initial, 'soft-drop')
    const paused = applyAction(changed, 'pause')

    expect(applyAction(paused, 'restart')).toEqual(initial)
  })

  it('changes difficulty only while paused without changing current progress', () => {
    const playing = {
      ...createGame(77),
      score: 0.5,
      lines: 4,
      level: 1,
    }
    const paused = applyAction(playing, 'pause')
    const changed = setDifficulty(paused, 'hard')

    expect(setDifficulty(playing, 'hard')).toBe(playing)
    expect(changed).toMatchObject({
      status: 'paused',
      difficulty: 'hard',
      score: 0.5,
      lines: 4,
      level: 1,
    })
    expect(changed.board).toBe(paused.board)
  })

  it('applies a paused difficulty change only to score earned afterward', () => {
    const scored = {
      ...stateWith(
        { type: 'O', rotation: 0, x: 3, y: 0 },
        createEmptyBoard(),
        ['T'],
        'T',
        'easy',
      ),
      score: 0.5,
    }
    const paused = applyAction(scored, 'pause')
    const changed = setDifficulty(paused, 'hard')
    const resumed = applyAction(changed, 'pause')

    expect(changed.score).toBe(0.5)
    expect(applyAction(resumed, 'soft-drop').score).toBe(2)
  })

  it('preserves difficulty across restart', () => {
    const paused = setDifficulty(applyAction(createGame(77), 'pause'), 'hard')
    const fresh = restart(paused)

    expect(fresh).toMatchObject({ score: 0, lines: 0, level: 1, difficulty: 'hard' })
    expect(fresh.board.flat()).toEqual(
      Array<Cell>(BOARD_WIDTH * BOARD_HEIGHT).fill(null),
    )
  })

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
    expect(applyAction(gameOver, 'hold')).toBe(gameOver)
    expect(applyAction(gameOver, 'pause')).toBe(gameOver)
  })

  it('restarts with a fresh empty board and active piece', () => {
    const playing = createGame(77)
    const dirty = applyAction(applyAction(playing, 'hold'), 'hard-drop')
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
