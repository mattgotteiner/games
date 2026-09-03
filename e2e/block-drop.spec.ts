import { expect, test } from '@playwright/test'

const lineClearKeys = [
  'ArrowUp',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'Space',
  'ArrowUp',
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
  'Space',
  'ArrowUp',
  'ArrowUp',
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
  'Space',
  'ArrowUp',
  'ArrowUp',
  'ArrowUp',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'Space',
  'ArrowRight',
  'ArrowRight',
  'Space',
  'ArrowUp',
  'ArrowUp',
  'ArrowLeft',
  'ArrowLeft',
  'Space',
  'ArrowUp',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'Space',
  'ArrowUp',
  'ArrowUp',
  'ArrowUp',
  'ArrowRight',
  'ArrowRight',
  'Space',
  'ArrowUp',
  'ArrowLeft',
  'Space',
  'ArrowUp',
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
  'Space',
  'ArrowUp',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'ArrowLeft',
  'Space',
  'ArrowRight',
  'ArrowRight',
  'Space',
  'ArrowUp',
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
  'ArrowRight',
  'Space',
] as const

async function expectGameFitsViewport(page: import('@playwright/test').Page) {
  const elements = [
    page.getByRole('img', { name: 'Block Drop board' }),
    page.getByLabel(/^Score:/),
    page.getByText(/^(Playing|Paused|Clearing lines|Game over)$/),
    page.getByRole('region', { name: /Next piece:/ }),
    page.locator('.game-controls'),
  ]

  for (const element of elements) {
    const box = await element.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    )
    expect(box!.y + box!.height).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerHeight),
    )
  }

  const canvasBox = await elements[0].boundingBox()
  expect(canvasBox!.width / canvasBox!.height).toBeCloseTo(0.5, 2)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= window.innerHeight,
    ),
  ).toBe(true)
}

async function expectPreviewCentered(page: import('@playwright/test').Page) {
  const frame = await page.locator('.next-piece-grid').boundingBox()
  const shape = await page.locator('.next-piece-shape').boundingBox()

  expect(frame).not.toBeNull()
  expect(shape).not.toBeNull()
  expect(shape!.x).toBeGreaterThanOrEqual(frame!.x)
  expect(shape!.y).toBeGreaterThanOrEqual(frame!.y)
  expect(shape!.x + shape!.width).toBeLessThanOrEqual(frame!.x + frame!.width)
  expect(shape!.y + shape!.height).toBeLessThanOrEqual(frame!.y + frame!.height)
  expect(shape!.x + shape!.width / 2).toBeCloseTo(
    frame!.x + frame!.width / 2,
    0,
  )
  expect(shape!.y + shape!.height / 2).toBeCloseTo(
    frame!.y + frame!.height / 2,
    0,
  )
}

async function expectMovementOrder(
  page: import('@playwright/test').Page,
  shortLandscape = false,
) {
  const left = await page.getByRole('button', { name: 'Move left' }).boundingBox()
  const right = await page
    .getByRole('button', { name: 'Move right' })
    .boundingBox()
  const rotate = await page
    .getByRole('button', { name: 'Rotate clockwise' })
    .boundingBox()
  const softDrop = await page
    .getByRole('button', { name: 'Soft drop' })
    .boundingBox()

  for (const box of [left, right, rotate, softDrop]) {
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
  expect(left!.y).toBeCloseTo(right!.y, 0)
  expect(right!.y).toBeCloseTo(rotate!.y, 0)
  expect(left!.x + left!.width).toBeLessThanOrEqual(right!.x)
  expect(right!.x + right!.width).toBeLessThanOrEqual(rotate!.x)

  if (shortLandscape) {
    expect(softDrop!.y).toBeGreaterThanOrEqual(left!.y + left!.height)
  } else {
    expect(rotate!.x + rotate!.width).toBeLessThanOrEqual(softDrop!.x)
  }
}

test('plays Block Drop with touch and keyboard across phone orientations', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    Date.now = () => 42
  })
  await page.goto('./')
  await page.getByRole('button', { name: 'Play Block Drop' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Block Drop' }),
  ).toBeVisible()
  await expect(page.getByText('Playing')).toBeVisible()
  const preview = page.getByRole('region', {
    name: /Next piece: [IJLOSTZ] tetromino/,
  })
  await expect(preview).toBeVisible()
  await expect(preview.locator('.next-piece-grid-cell')).toHaveCount(36)
  await expect(preview.locator('.next-piece-cell')).toHaveCount(4)
  await expect(preview.locator('.next-piece-cell.is-filled')).toHaveCount(4)
  await expect(preview.locator('.next-piece-shape')).toHaveAttribute(
    'data-width',
    '2',
  )
  await expectPreviewCentered(page)
  await expectMovementOrder(page)
  const initialPreview = await preview.getAttribute('aria-label')
  const initialPreviewGrid = await preview.locator('.next-piece-grid').innerHTML()

  const canvas = page.getByRole('img', { name: 'Block Drop board' })
  await expect(canvas).toBeVisible()
  await expect(page.getByRole('button', { name: 'Move left' })).toBeEnabled()
  for (const button of await page.getByRole('button').all()) {
    const box = await button.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
  const portraitBoard = await canvas.boundingBox()
  const portraitHud = await page.locator('.game-hud').boundingBox()
  expect(portraitHud!.y + portraitHud!.height).toBeLessThanOrEqual(
    portraitBoard!.y,
  )
  const captureBoard = () =>
    canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL())
  const initialBoard = await captureBoard()

  await page.keyboard.press('ArrowLeft')
  const keyboardBoard = await captureBoard()
  expect(keyboardBoard).not.toBe(initialBoard)

  await page.getByRole('button', { name: 'Move right' }).click()
  const touchBoard = await captureBoard()
  expect(touchBoard).not.toBe(keyboardBoard)

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.keyboard.press('Space')
  await expect(preview).not.toHaveAttribute('aria-label', initialPreview!)
  await expect(preview.locator('.next-piece-cell.is-filled')).toHaveCount(4)
  await expect(preview.locator('.next-piece-shape')).toHaveAttribute(
    'data-width',
    '3',
  )
  expect(await preview.locator('.next-piece-grid').innerHTML()).not.toBe(
    initialPreviewGrid,
  )

  const pause = page.getByRole('button', { name: 'Pause game' })
  await pause.click()
  await expect(page.getByText('Paused')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Move left' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Hard drop' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Restart game' })).toBeEnabled()
  const pausedBoard = await captureBoard()
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.waitForTimeout(900)
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Space')
  expect(await captureBoard()).toBe(pausedBoard)

  await page.keyboard.press('p')
  await expect(page.getByText('Playing')).toBeVisible()
  const resumedBoard = await captureBoard()
  await page.waitForTimeout(400)
  expect(await captureBoard()).toBe(resumedBoard)
  await expect.poll(captureBoard, { timeout: 1_000 }).not.toBe(resumedBoard)

  await page.getByRole('button', { name: 'Pause game' }).click()
  await page.getByRole('button', { name: 'Restart game' }).click()
  await expect(page.getByText('Playing')).toBeVisible()
  await expect(page.getByLabel('Score: 0')).toBeVisible()

  await expectGameFitsViewport(page)

  await page.setViewportSize({ width: 844, height: 390 })
  await expect.poll(async () => (await canvas.boundingBox())?.height).toBeLessThan(
    390,
  )
  await expectGameFitsViewport(page)
  await expectPreviewCentered(page)
  await expectMovementOrder(page, true)
  const landscapeBoard = await canvas.boundingBox()
  const landscapeHud = await page.locator('.game-hud').boundingBox()
  expect(landscapeHud!.x).toBeGreaterThanOrEqual(
    landscapeBoard!.x + landscapeBoard!.width,
  )

  await page.setViewportSize({ width: 568, height: 320 })
  await expect.poll(async () => (await canvas.boundingBox())?.height).toBeLessThan(
    320,
  )
  await expectGameFitsViewport(page)
  await expectPreviewCentered(page)
  await expectMovementOrder(page, true)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)

  await page.getByRole('button', { name: /catalog/i }).click()
  await expect(
    page.getByRole('button', { name: 'Play Block Drop' }),
  ).toBeVisible()
})

test('presents a prominent right-side HUD and polished button states', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('./')

  const play = page.getByRole('button', { name: 'Play Block Drop' })
  await play.focus()
  expect(
    await play.evaluate((element) => getComputedStyle(element).outlineWidth),
  ).toBe('3px')
  const playBox = await play.boundingBox()
  expect(playBox!.height).toBeGreaterThanOrEqual(44)
  await play.click()

  const canvas = page.getByRole('img', { name: 'Block Drop board' })
  const hud = page.getByRole('complementary', { name: 'Game information' })
  const preview = page.locator('.next-piece-grid')
  const canvasBox = await canvas.boundingBox()
  const hudBox = await hud.boundingBox()
  expect(hudBox!.x).toBeGreaterThanOrEqual(canvasBox!.x + canvasBox!.width)
  expect((await preview.boundingBox())!.width).toBeGreaterThanOrEqual(96)
  expect(
    Number.parseFloat(
      await page
        .locator('.game-score-value')
        .evaluate((element) => getComputedStyle(element).fontSize),
    ),
  ).toBeGreaterThanOrEqual(48)

  for (const button of await page.getByRole('button').all()) {
    const box = await button.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }

  const drop = page.getByRole('button', { name: 'Hard drop' })
  await drop.focus()
  expect(
    await drop.evaluate((element) => getComputedStyle(element).outlineWidth),
  ).toBe('3px')
  const before = await drop.boundingBox()
  await drop.hover()
  await page.mouse.down()
  const pressed = await drop.boundingBox()
  expect(pressed).toEqual(before)
  expect(await drop.evaluate((element) => getComputedStyle(element).boxShadow)).not
    .toBe('none')
  await page.mouse.up()
})

test('animates an exact deterministic line clear and gates gameplay', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Date.now = () => 42
  })
  await page.goto('./')
  await page.getByRole('button', { name: 'Play Block Drop' }).click()
  const canvas = page.getByRole('img', { name: 'Block Drop board' })

  await page.evaluate((keys) => {
    for (const key of keys) {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: key === 'Space' ? ' ' : key,
          bubbles: true,
          cancelable: true,
        }),
      )
    }
  }, lineClearKeys)

  expect(await canvas.getAttribute('data-clearing-rows')).toBe('14')
  await expect(page.getByText('Clearing lines')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Move left' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Pause game' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Restart game' })).toBeEnabled()

  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('p')
  await expect(page.getByText('Clearing lines')).toBeVisible()
  await expect(canvas).not.toHaveAttribute('data-clearing-rows')
  await expect(page.getByText('Playing')).toBeVisible()
  await expect(page.getByLabel('Score: 442')).toBeVisible()
  await expect(
    page.getByRole('region', {
      name: 'Next piece: Z tetromino',
    }),
  ).toBeVisible()

  const settled = await canvas.evaluate((element) =>
    (element as HTMLCanvasElement).toDataURL(),
  )
  await page.waitForTimeout(300)
  expect(
    await canvas.evaluate((element) =>
      (element as HTMLCanvasElement).toDataURL(),
    ),
  ).toBe(settled)
})

test('opens Block Drop directly and follows browser history', async ({ page }) => {
  await page.goto('./?theme=dark#catalog')
  await page.getByRole('button', { name: 'Play Block Drop' }).click()

  await expect(page).toHaveURL(
    /\/games\/\?theme=dark&game=block-drop#catalog$/,
  )
  await expect(
    page.getByRole('heading', { level: 1, name: 'Block Drop' }),
  ).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\/games\/\?theme=dark#catalog$/)
  await expect(
    page.getByRole('button', { name: 'Play Block Drop' }),
  ).toBeVisible()

  await page.goForward()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Block Drop' }),
  ).toBeVisible()

  await page.reload()
  await expect(page).toHaveURL(
    /\/games\/\?theme=dark&game=block-drop#catalog$/,
  )
  await expect(
    page.getByRole('heading', { level: 1, name: 'Block Drop' }),
  ).toBeVisible()
})
