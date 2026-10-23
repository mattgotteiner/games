import { mkdir } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
interface FixtureState {
  difficulty: 'easy'|'medium'|'hard'; activeSpeedMultiplier: number; rallyHits: number; status: string; lives: number; score: number; paddleX: number; feedbackMs: number
  ball: { x: number; y: number; vx: number; vy: number; speed: number }
  bricks: Array<{ kind: string; damaged: boolean } | null>
}
interface FixtureController { getState(): FixtureState; dispatch(action: { type: string; x?: number; difficulty?: 'easy'|'medium'|'hard' }): void }
declare global {
  interface Window {
    __brickBurstFrame: FrameRequestCallback
    __brickBurstController: FixtureController
    __brickBurstTime: number
  }
}
const devURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5174/games/'
const output = 'test-results/brick-burst/pace'

// Only the browser test intercepts this module. No fixture or debug hooks ship in the app.
async function fixture(page: Page, patch: Partial<FixtureState>) {
  await page.goto(devURL)
  const initialState = await page.evaluate(async (patch) => {
    const load = new Function('path', 'return import(path)') as (path: string) => Promise<{ createGame(seed: number): FixtureState }>
    const rules = await load('/games/src/games/brick-burst/rules.ts')
    return { ...rules.createGame(41), ...patch }
  }, patch)
  await page.route('**/src/games/brick-burst/BrickBurst.tsx*', async (route) => {
    const response = await route.fetch(), source = await response.text()
    expect(source).toContain('new BrickBurstController(...args)')
    const patched = source.replace('new BrickBurstController(...args)',
      `(window.__brickBurstController = new BrickBurstController(args[0],args[1],args[2],{...args[3],initialState:${JSON.stringify(initialState)},requestFrame:cb=>{window.__brickBurstFrame=t=>{window.__brickBurstTime=t;cb(t)};return 1},cancelFrame:()=>{}}))`)
    const headers = response.headers()
    delete headers.etag
    headers['cache-control'] = 'no-store'
    await route.fulfill({ response, body: patched, headers })
  })
  await page.goto(`${devURL}?game=brick-burst`)
  await expect(page.getByRole('heading', { level: 1, name: 'Brick Burst' })).toBeVisible()
  await page.waitForFunction(() => Boolean(window.__brickBurstFrame))
  await page.evaluate(() => window.__brickBurstFrame(0))
}
async function advance(page: Page, from: number, to: number) {
  await page.evaluate(({ from, to }) => { for (let time = from + 1000 / 60; time <= to + 1e-6; time += 1000 / 60) window.__brickBurstFrame(time) }, { from, to })
}
async function capture(page: Page, name: string) {
  await mkdir(output, { recursive: true })
  await page.screenshot({ path: `${output}/${name}.png` })
}
async function touchDrag(page: Page, startX: number, y: number, dx: number) {
  const cdp = await page.context().newCDPSession(page)
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y }] })
    for (let i = 1; i <= 5; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: startX + dx * i / 5, y }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } finally { await cdp.detach() }
}

test('launches both catalog games, deep-links, and restores colors with Back', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByText('2 games')).toBeVisible()
  await expect(page.locator('.game-card h3')).toHaveText(['Block Drop', 'Brick Burst'])
  const before = await page.evaluate(() => ({ background: getComputedStyle(document.body).backgroundColor, theme: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') }))
  await page.getByRole('button', { name: 'Play Brick Burst' }).click()
  await expect(page).toHaveURL(/game=brick-burst/)
  await expect(page.getByRole('button', { name: 'Serve ball' })).toBeEnabled()
  await expect(page.getByRole('button', { name: /catalog/i })).toHaveCount(0)
  await page.goBack(); await expect(page.getByRole('button', { name: 'Play Brick Burst' })).toBeVisible()
  expect(await page.evaluate(() => ({ background: getComputedStyle(document.body).backgroundColor, theme: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') }))).toEqual(before)
  expect(await page.evaluate(() => document.documentElement.hasAttribute('data-brick-burst-theme'))).toBe(false)
  await page.goForward(); await expect(page.getByRole('heading', { name: 'Brick Burst', exact: true })).toBeVisible()
  await page.reload(); await expect(page.getByRole('button', { name: 'Serve ball' })).toBeEnabled()
})

test('fits portrait, landscape, small phones, and a wide display without scrolling', async ({ page }) => {
  for (const [width, height] of [[390, 844], [320, 568], [844, 390], [1280, 800]]) {
    await page.setViewportSize({ width, height }); await page.goto('./?game=brick-burst')
    const canvas = page.getByRole('img', { name: 'Brick Burst board' })
    const box = await canvas.boundingBox(); expect(box).not.toBeNull()
    expect(box!.width / box!.height).toBeCloseTo(2 / 3, 2)
    if (width === 390) expect(box!.height).toBeGreaterThanOrEqual(520)
    for (const element of [canvas, page.locator('.game-hud'), page.locator('.control-bar')]) {
      const rect = (await element.boundingBox())!
      expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.y).toBeGreaterThanOrEqual(0)
      expect(rect.x + rect.width).toBeLessThanOrEqual(width + 1); expect(rect.y + rect.height).toBeLessThanOrEqual(height + 1)
    }
    for (const button of await page.locator('.control-bar button').all()) {
      const rect = (await button.boundingBox())!; expect(rect.height).toBeGreaterThanOrEqual(56); expect(rect.width).toBeGreaterThanOrEqual(56)
    }
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true)
    const backing = await canvas.evaluate((c: HTMLCanvasElement) => ({ width: c.width, css: c.getBoundingClientRect().width, dpr: devicePixelRatio }))
    expect(backing.width).toBe(Math.round(backing.css * backing.dpr))
    await page.getByRole('button', { name: 'Pause game' }).click()
    const pause = page.getByRole('group', { name: 'Paused' })
    await expect(pause.getByRole('button', { name: 'Resume game' })).toBeFocused()
    await pause.getByRole('button', { name: 'Help' }).click()
    const dialog = page.getByRole('dialog', { name: 'Help' }); await expect(dialog).toBeVisible()
    const scrolling = await dialog.locator('.help-dialog-content').evaluate((el) => ({ client: el.clientHeight, scroll: el.scrollHeight }))
    if (height <= 568) expect(scrolling.scroll).toBeGreaterThan(scrolling.client)
    await page.getByRole('button', { name: 'Close help' }).click(); await expect(pause.getByRole('button', { name: 'Help' })).toBeFocused()
  }
})

test('steers with real touch gestures without scrolling or accidental serves, then serves with a tap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await fixture(page, {})
  await advance(page, 0, 500)
  const box = (await page.locator('canvas').boundingBox())!
  await touchDrag(page, box.x + 80, box.y + 300, 50)
  const paddle = await page.evaluate(() => window.__brickBurstController.getState().paddleX)
  expect((paddle - 192) * box.width / 384).toBeCloseTo(50, 0)
  await expect(page.getByRole('button', { name: 'Serve ball' })).toBeEnabled()
  expect(await page.evaluate(() => ({ x: scrollX, y: scrollY, scale: visualViewport!.scale }))).toEqual({ x: 0, y: 0, scale: 1 })
  // A tap shorter than the steering threshold serves without moving the paddle.
  const tap = await page.context().newCDPSession(page)
  try {
    await tap.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + 100, y: box.y + 250 }] })
    await tap.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } finally { await tap.detach() }
  await expect(page.getByRole('button', { name: 'Serve ball' })).toBeDisabled()
  expect(await page.evaluate(() => window.__brickBurstController.getState().paddleX)).toBe(paddle)
  await page.getByRole('button', { name: 'Pause game' }).click()
  const frozen = await page.evaluate(() => window.__brickBurstController.getState())
  await advance(page, 500, 2000)
  expect(await page.evaluate(() => window.__brickBurstController.getState())).toEqual(frozen)
  await page.getByRole('group', { name: 'Paused' }).getByRole('button', { name: 'Resume game' }).click()
  await expect(page.locator('.game-status')).toHaveText('Playing')
})

test('keeps held ArrowLeft steering through a seeded lost ball', async ({ page }) => {
  await fixture(page, { status: 'playing', ball: { x: 80, y: 582, vx: 0, vy: 390, speed: 390 } })
  await page.keyboard.down('ArrowLeft')
  await advance(page, 0, 50)
  await expect(page.locator('.game-status')).toHaveText('Ball lost')
  const frozenX = await page.evaluate(() => window.__brickBurstController.getState().paddleX)
  await advance(page, 50, 800)
  await expect(page.getByRole('button', { name: 'Serve ball' })).toBeEnabled()
  expect(await page.evaluate(() => window.__brickBurstController.getState().paddleX)).toBeLessThan(frozenX)
  await page.keyboard.up('ArrowLeft')
  const x = await page.evaluate(() => window.__brickBurstController.getState().paddleX)
  await advance(page, 800, 850)
  expect(await page.evaluate(() => window.__brickBurstController.getState().paddleX)).toBe(x)
})

test('persists difficulty and best score, loses all three balls, and plays again', async ({ page }) => {
  const initial = { score: 120 }
  await fixture(page, initial)
  for (let lives = 3; lives > 0; lives--) {
    // Mouse aim at the right wall, then let the seeded leftward serve fall clear of the paddle.
    await page.evaluate(() => { window.__brickBurstController.dispatch({ type: 'paddle-to', x: 352 }); window.__brickBurstController.dispatch({ type: 'serve' }) })
    // Advance until this ball is lost, preserving the real rules/controller path.
    await page.evaluate((lives) => { let t = window.__brickBurstTime; for (let i = 0; i < 2000 && window.__brickBurstController.getState().lives === lives; i++) { t += 1000 / 60; window.__brickBurstFrame(t) } }, lives)
    await expect(page.getByRole('img', { name: `${lives - 1} ${lives - 1 === 1 ? 'life' : 'lives'}` })).toBeVisible()
    if (lives > 1) {
      await page.evaluate(() => { let t = window.__brickBurstTime; for (let i = 0; i < 50; i++) window.__brickBurstFrame(t += 1000 / 60) })
      await expect(page.getByRole('button', { name: 'Serve ball' })).toBeEnabled()
    }
  }
  await expect(page.getByRole('button', { name: 'Play again' })).toBeFocused()
  await expect(page.getByText('New best')).toBeVisible()
  expect(await page.evaluate(() => Number(localStorage.getItem('games.brick-burst.best-score')))).toBeGreaterThanOrEqual(120)
  await page.getByRole('button', { name: 'Play again' }).click(); await expect(page.getByRole('img', { name: '3 lives' })).toBeVisible()
  await page.getByRole('button', { name: 'Pause game' }).click()
  await page.getByRole('slider', { name: 'Difficulty' }).fill('2')
  await expect(page.locator('.brick-difficulty')).toHaveText('Hard · 1.25×')
  expect(await page.evaluate(() => localStorage.getItem('games.brick-burst.difficulty'))).toBe('hard')
  await page.unrouteAll(); await page.goto(`${devURL}?game=brick-burst`)
  await expect(page.locator('.brick-difficulty')).toHaveText('Hard · 1.25×')
})

test('launches and plays Brick Burst offline after a controlled online load', async ({ context, page }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL), 'Requires the built production service worker.')
  await page.goto('./')
  await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true })) })
  await context.setOffline(true)
  await page.goto('./?game=brick-burst')
  await expect(page.getByRole('button', { name: 'Serve ball' })).toBeEnabled()
  await page.getByRole('button', { name: 'Serve ball' }).click(); await expect(page.locator('.game-status')).toHaveText('Playing')
  await page.getByRole('button', { name: 'Pause game' }).click(); await expect(page.getByRole('group', { name: 'Paused' })).toBeVisible()
})

test('uses a 650 ms DOM callout and matching level-clear rules', async ({ page }) => {
  await fixture(page,{bricks:Array(96).fill(null),status:'level-clear',feedbackMs:650})
  expect(await page.locator('.line-clear-callout').evaluate(el=>getComputedStyle(el).animationDuration)).toBe('0.65s')
  await advance(page,0,1000 / 60 * 38)
  await expect(page.locator('.game-status')).toHaveText('Level clear')
  await advance(page,1000 / 60 * 38,650)
  await expect(page.locator('.game-status')).toHaveText('Ready')
  await expect(page.locator('.brick-level strong')).toHaveText('2')
})

test('captures the phone serving, rally, pop, ball lost, level clear, pause, and game over states', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await fixture(page, {}); await advance(page, 0, 500); await capture(page, 'phone-serving')
  await page.getByRole('button', { name: 'Serve ball' }).click(); await advance(page, 500, 1200); await capture(page, 'phone-rally')
  await page.getByRole('button', { name: 'Pause game' }).click(); await capture(page, 'phone-paused')
  await page.unrouteAll()
  const pop = { status: 'playing' }
  await fixture(page, { ...pop, ball: { x: 176, y: 181.5, vx: 0, vy: -390, speed: 390 } })
  await advance(page, 0, 66.6667); await capture(page, 'phone-mid-pop')
  await page.unrouteAll()
  await fixture(page, { status: 'ball-lost', lives: 2, feedbackMs: 200 })
  await page.waitForTimeout(320); await capture(page, 'phone-ball-lost'); await page.unrouteAll()
  await fixture(page, { bricks: Array(96).fill(null), status: 'level-clear', score: 2500, feedbackMs: 422.5 })
  await capture(page, 'phone-level-clear'); await page.unrouteAll()
  await fixture(page, { status: 'over', score: 2500, lives: 0 })
  await expect(page.getByRole('button', { name: 'Play again' })).toBeFocused(); await page.waitForTimeout(320); await capture(page, 'phone-game-over')
})

test('captures sustained and capped rallies on each difficulty plus reduced motion', async ({ page }) => {
  await page.setViewportSize({width:390,height:844})
  for (const [difficulty,multiplier] of [['easy',0.75],['medium',1],['hard',1.25]] as const) {
    await page.emulateMedia({reducedMotion:'no-preference'})
    await fixture(page,{})
    await page.evaluate((difficulty)=>{
      const c=window.__brickBurstController
      c.dispatch({type:'set-difficulty',difficulty});c.dispatch({type:'serve'})
    },difficulty)
    await page.evaluate(()=>{
      for(let time=1000/60;time<=4000+1e-6;time+=1000/60) {
        const c=window.__brickBurstController
        c.dispatch({type:'paddle-to',x:c.getState().ball.x})
        window.__brickBurstFrame(time)
      }
    })
    await expect(page.locator('.game-status')).toHaveText('Playing')
    expect(await page.evaluate(()=>window.__brickBurstController.getState().score)).toBeGreaterThan(0)
    await capture(page,`${difficulty}-sustained-rally`)
    await page.unrouteAll()
    const speed=390*multiplier*1.6
    await fixture(page,{status:'playing',difficulty,activeSpeedMultiplier:multiplier,rallyHits:48,
      score:[40,30,30,20].reduce((sum,points)=>sum+12*Math.round(points*multiplier),0),
      bricks:Array.from({length:96},(_,i)=>i>=60&&i<84?{kind:'normal',damaged:false}:null),
      ball:{x:230,y:300,vx:speed*0.5,vy:-speed*Math.sqrt(0.75),speed}})
    await advance(page,0,100);await capture(page,`${difficulty}-capped-rally`)
    await page.unrouteAll()
  }
  await page.emulateMedia({reducedMotion:'reduce'})
  await fixture(page,{bricks:Array(96).fill(null),status:'level-clear',feedbackMs:422.5})
  await capture(page,'phone-reduced-motion-level-clear')
})
