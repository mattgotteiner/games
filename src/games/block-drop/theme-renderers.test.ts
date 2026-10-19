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
        if (property === 'createLinearGradient') {
          return (...args: unknown[]) => {
            calls.push(['createLinearGradient', ...args])
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
