import { expect, test } from '@playwright/test'

interface ProfileGeometry {
  readonly cell: number
  readonly offsetX: number
  readonly offsetY: number
  readonly width: number
  readonly height: number
  readonly ratio: number
}

interface ProfileCell extends ProfileGeometry {
  readonly x: number
  readonly y: number
  readonly type: string
  readonly seed: number
}

interface ProfileRenderer {
  drawBackground(
    context: CanvasRenderingContext2D,
    theme: ProfileTheme,
    geometry: ProfileGeometry,
  ): void
  drawCell(
    context: CanvasRenderingContext2D,
    theme: ProfileTheme,
    cell: ProfileCell,
  ): void
  drawLineClear(
    context: CanvasRenderingContext2D,
    theme: ProfileTheme,
    draw: ProfileGeometry & {
      readonly rows: ReadonlyArray<number>
      readonly board: ReadonlyArray<ReadonlyArray<string | null>>
      readonly progress: number
    },
  ): void
}

interface ProfileTheme {
  readonly pieces: Readonly<Record<string, string>>
  readonly board: {
    readonly background: string
    readonly grid: string
    readonly gridWidth: number
  }
}

interface ThemeProfile {
  readonly theme: string
  readonly frames: number
  readonly maximumFrameMs: number
  readonly p95FrameMs: number
  readonly framesOverBudget: number
}

test('keeps full-board four-row clears under 16 ms with 4× CPU slowdown', async ({
  browser,
}) => {
  test.skip(
    Boolean(process.env.PLAYWRIGHT_BASE_URL),
    'This renderer benchmark imports source modules from the local Vite server.',
  )

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)

  try {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.goto('http://127.0.0.1:5174/games/')

    const profiles = await page.evaluate(async () => {
      type ThemeId =
        | 'classic'
        | 'tron'
        | 'chocolate'
        | 'nature'
        | 'sketchbook'
        | 'stained-glass'
      type RendererMap = Partial<Record<ThemeId, ProfileRenderer>>
      type ThemeMap = Record<ThemeId, ProfileTheme>

      const importViteModule = new Function(
        'path',
        'return import(path)',
      ) as (path: string) => Promise<unknown>
      const [rendererModule, themeModule, sharedModule] = await Promise.all([
        importViteModule('/games/src/games/block-drop/theme-renderers/index.ts'),
        importViteModule('/games/src/games/block-drop/themes.ts'),
        importViteModule('/games/src/games/shared/canvas.ts'),
      ]) as [
        { THEME_RENDERERS: RendererMap },
        { BLOCK_DROP_THEMES: ThemeMap },
        { hash: (x: number, y: number) => number },
      ]

      const themeIds: ReadonlyArray<ThemeId> = [
        'classic',
        'tron',
        'chocolate',
        'nature',
        'sketchbook',
        'stained-glass',
      ]
      const rows = [16, 17, 18, 19]
      const pieceTypes = ['I', 'J', 'L', 'O', 'S', 'T', 'Z']
      const board = Array.from({ length: 20 }, (_, y) =>
        Array.from(
          { length: 10 },
          (_, x) => pieceTypes[(x + y * 3) % pieceTypes.length],
        ),
      )
      const ratio = window.devicePixelRatio
      const cell = 28
      const geometry: ProfileGeometry = {
        cell,
        offsetX: 0,
        offsetY: 0,
        width: cell * 10,
        height: cell * 20,
        ratio,
      }
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(geometry.width * ratio)
      canvas.height = Math.ceil(geometry.height * ratio)
      document.body.replaceChildren(canvas)
      const context = canvas.getContext('2d')
      if (context === null) throw new Error('Canvas 2D context is unavailable')

      const framesPerTheme = 45
      const results: ThemeProfile[] = []
      for (const themeId of themeIds) {
        const renderer = rendererModule.THEME_RENDERERS[themeId]
        const theme = themeModule.BLOCK_DROP_THEMES[themeId]
        if (renderer === undefined || theme === undefined) {
          throw new Error(`Missing renderer for ${themeId}`)
        }

        const drawFrame = (progress: number) => {
          context.setTransform(ratio, 0, 0, ratio, 0, 0)
          context.clearRect(0, 0, geometry.width, geometry.height)
          renderer.drawBackground(context, theme, geometry)

          const clearingRows = new Set(rows)
          const cellDraw = {
            ...geometry,
            x: 0,
            y: 0,
            type: 'I',
            seed: 0,
          }
          for (let y = 0; y < 20; y += 1) {
            if (clearingRows.has(y)) continue
            for (let x = 0; x < 10; x += 1) {
              const type = board[y][x]
              if (type === undefined) continue
              cellDraw.x = x
              cellDraw.y = y
              cellDraw.type = type
              cellDraw.seed = sharedModule.hash(x, y)
              renderer.drawCell(context, theme, cellDraw)
            }
          }

          renderer.drawLineClear(context, theme, {
            ...geometry,
            rows,
            board,
            progress,
          })
        }

        // Let the browser compile and optimize each renderer before measuring
        // its steady-state frame work.
        for (let warmup = 0; warmup < 8; warmup += 1) {
          drawFrame(warmup / 7)
        }

        const durations: number[] = []
        for (let frame = 0; frame < framesPerTheme; frame += 1) {
          const start = performance.now()
          drawFrame(frame / (framesPerTheme - 1))
          durations.push(performance.now() - start)
        }

        const ordered = [...durations].sort((a, b) => a - b)
        results.push({
          theme: themeId,
          frames: durations.length,
          maximumFrameMs: Math.max(...durations),
          p95FrameMs: ordered[Math.ceil(ordered.length * 0.95) - 1] ?? 0,
          framesOverBudget: durations.filter((duration) => duration >= 16).length,
        })
      }
      return results
    })

    console.log('Four-row full-board profile at 4× CPU slowdown:', profiles)
    expect(profiles).toHaveLength(6)
    for (const profile of profiles) {
      expect(profile.frames).toBe(45)
      expect(profile.framesOverBudget, `${profile.theme} frame durations`).toBe(0)
      expect(profile.maximumFrameMs, `${profile.theme} maximum frame`).toBeLessThan(
        16,
      )
    }
  } finally {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    await context.close()
  }
})
