import { describe, expect, it, vi } from 'vitest'
import { BOARD_HEIGHT, BOARD_WIDTH, createEmptyBoard } from './rules'
import { BLOCK_DROP_THEMES } from './themes'
import {
  IMPLEMENTED_BLOCK_DROP_THEME_ORDER,
  THEME_RENDERERS,
  type BoardGeometry,
  type CellDraw,
  type LineClearDraw,
} from './theme-renderers'

type RecordedCall = ReadonlyArray<unknown>

function recordingContext(): {
  readonly calls: RecordedCall[]
  readonly context: CanvasRenderingContext2D
} {
  const calls: RecordedCall[] = []
  const gradient = {
    addColorStop(offset: number, color: string) {
      calls.push(['addColorStop', offset, color])
    },
  }
  const context = new Proxy(
    {},
    {
      get(_target, property) {
        if (
          property === 'createLinearGradient' ||
          property === 'createRadialGradient'
        ) {
          return (...args: unknown[]) => {
            calls.push([String(property), ...args])
            return gradient
          }
        }
        return (...args: unknown[]) => {
          calls.push([String(property), ...args])
        }
      },
      set(_target, property, value) {
        calls.push([
          'set',
          String(property),
          value === gradient ? 'gradient' : value,
        ])
        return true
      },
    },
  ) as CanvasRenderingContext2D

  return { calls, context }
}

const geometry: BoardGeometry = {
  cell: 18,
  offsetX: 0,
  offsetY: 0,
  width: BOARD_WIDTH * 18,
  height: BOARD_HEIGHT * 18,
  ratio: 2,
}

const cell: CellDraw = {
  ...geometry,
  x: 4,
  y: 8,
  type: 'T',
  seed: 30,
}

const board = createEmptyBoard().map((row, y) =>
  row.map((value, x) =>
    y === BOARD_HEIGHT - 1
      ? (['I', 'J', 'L', 'O', 'S', 'T', 'Z'][x % 7] as Exclude<
          typeof value,
          null
        >)
      : value,
  ),
)

function lineClear(progress: number): LineClearDraw {
  return {
    ...geometry,
    rows: [BOARD_HEIGHT - 1],
    board,
    progress,
  }
}

function doubleLineClear(progress: number): LineClearDraw {
  const rows = [BOARD_HEIGHT - 2, BOARD_HEIGHT - 1]
  const stackedBoard = createEmptyBoard().map((boardRow, y) =>
    rows.includes(y)
      ? boardRow.map(
          (_value, x) =>
            ['I', 'J', 'L', 'O', 'S', 'T', 'Z'][x % 7] as Exclude<
              typeof boardRow[number],
              null
            >,
        )
      : boardRow,
  )

  return { ...geometry, rows, board: stackedBoard, progress }
}

describe('Block Drop theme renderers', () => {
  it('keeps Chocolate cells and ghosts square-cornered', () => {
    const { calls, context } = recordingContext()
    const renderer = THEME_RENDERERS.chocolate!
    renderer.drawCell(context, BLOCK_DROP_THEMES.chocolate, cell)
    renderer.drawGhostCell(context, BLOCK_DROP_THEMES.chocolate, {
      ...cell,
      x: 5,
      y: 17,
      type: 'I',
    })

    const callNames = calls.map(([name]) => name)
    expect(callNames).not.toContain('roundRect')
    expect(callNames).not.toContain('arc')
    expect(callNames).toContain('fillRect')
    expect(callNames).toContain('strokeRect')
  })

  it('melts adjacent Chocolate clear rows as one stacked mass', () => {
    const { calls, context } = recordingContext()
    const rows = [BOARD_HEIGHT - 2, BOARD_HEIGHT - 1]
    const stackedBoard = createEmptyBoard().map((boardRow, y) =>
      rows.includes(y)
        ? boardRow.map(
            (_value, x) =>
              ['I', 'J', 'L', 'O', 'S', 'T', 'Z'][x % 7] as Exclude<
                typeof boardRow[number],
                null
              >,
          )
        : boardRow,
    )

    THEME_RENDERERS.chocolate!.drawLineClear(
      context,
      BLOCK_DROP_THEMES.chocolate,
      {
        ...lineClear(0.5),
        rows,
        board: stackedBoard,
      },
    )

    expect(calls.filter(([name]) => name === 'stroke')).toHaveLength(1)
  })

  it('keeps Nature stone cells and ghosts square-cornered', () => {
    const { calls, context } = recordingContext()
    const renderer = THEME_RENDERERS.nature!
    renderer.drawCell(context, BLOCK_DROP_THEMES.nature, cell)
    renderer.drawGhostCell(context, BLOCK_DROP_THEMES.nature, {
      ...cell,
      x: 5,
      y: 17,
      type: 'I',
    })

    const callNames = calls.map(([name]) => name)
    expect(callNames).not.toContain('roundRect')
    expect(callNames).toContain('createRadialGradient')
    expect(callNames).toContain('fillRect')
    expect(callNames).toContain('strokeRect')
  })

  it('turns Nature clear stones into drifting leaves', () => {
    const { calls, context } = recordingContext()
    THEME_RENDERERS.nature!.drawLineClear(
      context,
      BLOCK_DROP_THEMES.nature,
      lineClear(0.5),
    )

    expect(calls.filter(([name]) => name === 'quadraticCurveTo')).toHaveLength(
      BOARD_WIDTH * 2,
    )
  })

  it('hatches Sketchbook cells and draws a dashed square ghost', () => {
    const { calls, context } = recordingContext()
    const renderer = THEME_RENDERERS.sketchbook!
    renderer.drawCell(context, BLOCK_DROP_THEMES.sketchbook, cell)
    renderer.drawGhostCell(context, BLOCK_DROP_THEMES.sketchbook, {
      ...cell,
      x: 5,
      y: 17,
      type: 'I',
    })

    const callNames = calls.map(([name]) => name)
    expect(callNames).not.toContain('roundRect')
    expect(callNames).not.toContain('arc')
    expect(callNames).toContain('clip')
    expect(callNames).toContain('strokeRect')
    expect(calls.filter(([name]) => name === 'setLineDash')).toHaveLength(1)
    expect(
      calls.some(
        ([name, property, value]) =>
          name === 'set' && property === 'strokeStyle' && value === '#3a3a3a',
      ),
    ).toBe(true)
  })

  it('scrubs stacked Sketchbook rows with one square eraser and crumbs', () => {
    const { calls, context } = recordingContext()
    THEME_RENDERERS.sketchbook!.drawLineClear(
      context,
      BLOCK_DROP_THEMES.sketchbook,
      doubleLineClear(0.5),
    )

    expect(calls.filter(([name]) => name === 'ellipse')).toHaveLength(
      BOARD_WIDTH * 2 * 3,
    )
    expect(calls.filter(([name]) => name === 'strokeRect')).toHaveLength(1)
    expect(calls.filter(([name]) => name === 'rotate')).toHaveLength(1)
    expect(calls.filter(([name]) => name === 'translate')).toHaveLength(1)
    expect(calls.map(([name]) => name)).not.toContain('roundRect')
  })

  it('moves the single Sketchbook eraser rightward and between clear rows', () => {
    const renderer = THEME_RENDERERS.sketchbook!
    const upperSweep = recordingContext()
    const lowerSweep = recordingContext()
    renderer.drawLineClear(
      upperSweep.context,
      BLOCK_DROP_THEMES.sketchbook,
      doubleLineClear(0.15),
    )
    renderer.drawLineClear(
      lowerSweep.context,
      BLOCK_DROP_THEMES.sketchbook,
      doubleLineClear(0.4),
    )

    const upperEraser = upperSweep.calls.find(([name]) => name === 'translate')
    const lowerEraser = lowerSweep.calls.find(([name]) => name === 'translate')
    expect(upperEraser).toHaveLength(3)
    expect(lowerEraser).toHaveLength(3)
    expect(lowerEraser![1]).toBeGreaterThan(upperEraser![1] as number)
    expect(lowerEraser![2]).toBeGreaterThan(upperEraser![2] as number)
  })

  it('draws Stained Glass panes with jewel gradients, streaks, glints, and lead', () => {
    const { calls, context } = recordingContext()
    const renderer = THEME_RENDERERS['stained-glass']!
    renderer.drawCell(context, BLOCK_DROP_THEMES['stained-glass'], cell)
    renderer.drawGhostCell(context, BLOCK_DROP_THEMES['stained-glass'], cell)

    const callNames = calls.map(([name]) => name)
    expect(callNames).not.toContain('roundRect')
    expect(callNames).toContain('createLinearGradient')
    expect(callNames).toContain('quadraticCurveTo')
    expect(callNames).toContain('fill')
    expect(callNames).toContain('strokeRect')
    expect(
      calls.some(
        ([name, property, value]) =>
          name === 'set' && property === 'strokeStyle' && value === '#161616',
      ),
    ).toBe(true)
    expect(
      calls.some(
        ([name, property, value]) =>
          name === 'set' && property === 'strokeStyle' && value === '#5a5a5a',
      ),
    ).toBe(true)
  })

  it('cracks Stained Glass panes before splitting them into four shards', () => {
    const renderer = THEME_RENDERERS['stained-glass']!
    const cracking = recordingContext()
    const shattering = recordingContext()
    renderer.drawLineClear(
      cracking.context,
      BLOCK_DROP_THEMES['stained-glass'],
      lineClear(0.15),
    )
    renderer.drawLineClear(
      shattering.context,
      BLOCK_DROP_THEMES['stained-glass'],
      doubleLineClear(0.65),
    )

    expect(
      cracking.calls.filter(([name]) => name === 'createLinearGradient'),
    ).toHaveLength(BOARD_WIDTH)
    expect(
      cracking.calls.filter(([name]) => name === 'lineTo'),
    ).toHaveLength(BOARD_WIDTH * 5)
    expect(
      shattering.calls.filter(([name]) => name === 'translate'),
    ).toHaveLength(BOARD_WIDTH * 2 * 4)
    expect(
      shattering.calls.filter(([name]) => name === 'rotate'),
    ).toHaveLength(BOARD_WIDTH * 2 * 4)
  })

  it.each(IMPLEMENTED_BLOCK_DROP_THEME_ORDER)(
    '%s draws deterministically without random values and supports clear endpoints',
    (themeId) => {
      const renderer = THEME_RENDERERS[themeId]!
      const random = vi.spyOn(Math, 'random')

      try {
        const render = (context: CanvasRenderingContext2D) => {
          renderer.drawBackground(context, BLOCK_DROP_THEMES[themeId], geometry)
          renderer.drawCell(context, BLOCK_DROP_THEMES[themeId], cell)
          renderer.drawGhostCell(context, BLOCK_DROP_THEMES[themeId], {
            ...cell,
            x: 5,
            y: 17,
            type: 'I',
          })
          renderer.drawLineClear(context, BLOCK_DROP_THEMES[themeId], lineClear(0.5))
        }

        const first = recordingContext()
        const second = recordingContext()
        render(first.context)
        render(second.context)
        expect(second.calls).toEqual(first.calls)

        for (const progress of [0, 0.5, 1]) {
          expect(() => {
            const { context } = recordingContext()
            renderer.drawLineClear(
              context,
              BLOCK_DROP_THEMES[themeId],
              lineClear(progress),
            )
          }).not.toThrow()
        }
        expect(random).not.toHaveBeenCalled()
      } finally {
        random.mockRestore()
      }
    },
  )
})
