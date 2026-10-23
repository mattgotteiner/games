import { expect, test } from '@playwright/test'

test('renders a full board, moving ball, and eight concurrent brick pops under 16 ms at 4× CPU slowdown', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true })
  const page = await context.newPage(), cdp = await context.newCDPSession(page)
  try {
    await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5174/games/')
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    const profile = await page.evaluate(async () => {
      const load = new Function('path', 'return import(path)') as (path: string) => Promise<unknown>
      type Draw = Record<string, (...args: unknown[]) => void>
      const [{ classicRenderer: r }, { BRICK_BURST_LOOKS: looks }] = await Promise.all([
        load('/games/src/games/brick-burst/renderer.ts'), load('/games/src/games/brick-burst/palette.ts'),
      ]) as [{ classicRenderer: Draw }, { BRICK_BURST_LOOKS: { classic: unknown } }]
      const look = looks.classic, canvas = document.createElement('canvas')
      const width = 350, scale = width / 384, dpr = devicePixelRatio
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(width * 1.5 * dpr)
      canvas.style.width = `${width}px`; document.body.replaceChildren(canvas)
      const ctx = canvas.getContext('2d')! as CanvasRenderingContext2D & { px: number; align: (n: number) => number }
      ctx.px = 1 / scale; ctx.align = (n) => Math.round(n * scale * dpr) / (scale * dpr)
      const brick = { row: 0, col: 0, kind: 'normal', damaged: false }, options = { alpha: 1, dy: 0 }
      const trail = Array.from({ length: 6 }, (_, i) => [230 - i * 3, 300 + i * 4])
      const frame = (p: number) => {
        ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0)
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 384, 576); ctx.clip()
        r.drawBackground(ctx, look)
        for (let row = 0; row < 8; row++) for (let col = 0; col < 12; col++) {
          brick.row = row; brick.col = col; brick.kind = col % 2 ? 'tough' : 'normal'; brick.damaged = col % 3 === 0
          r.drawBrick(ctx, look, brick, options)
        }
        for (let col = 2; col < 10; col++) {
          brick.col = col; brick.row = 6
          r.drawBrickPop(ctx, look, brick, [180, 180], 300, p)
        }
        r.drawPaddle(ctx, look, 170 + p * 50); r.drawBall(ctx, look, 230 + p * 30, 300 - p * 40, trail)
        ctx.restore()
      }
      // Warm the recipes before measuring steady gameplay, as in the Block Drop benchmark.
      for (let i = 0; i < 15; i++) frame(i / 15)
      const times: number[] = []
      for (let i = 0; i < 60; i++) {
        await new Promise(requestAnimationFrame)
        const start = performance.now(); frame(i / 60); times.push(performance.now() - start)
      }
      times.sort((a, b) => a - b)
      return { frames: times.length, maximumMs: times[times.length - 1], p95Ms: times[Math.floor(times.length * 0.95)], framesOverBudget: times.filter((ms) => ms >= 16).length }
    })
    console.log('Brick Burst 4× CPU profile:', profile)
    expect(profile.framesOverBudget).toBe(0); expect(profile.maximumMs).toBeLessThan(16)
  } finally { await context.close() }
})
