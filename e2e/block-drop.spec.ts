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

// Seed 42: these deterministic placements end with a two-row clear.
const doubleLineClearSteps = [
  { keys: ['ArrowRight', 'Space'], rows: [] },
  { keys: ['ArrowRight', 'ArrowRight', 'ArrowRight', 'Space'], rows: [] },
  { keys: ['ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'Space'], rows: [] },
  { keys: ['ArrowLeft', 'ArrowUp', 'ArrowUp', 'Space'], rows: [] },
  {
    keys: [
      'ArrowRight',
      'ArrowRight',
      'ArrowRight',
      'ArrowRight',
      'ArrowUp',
      'ArrowUp',
      'ArrowUp',
      'ArrowRight',
      'Space',
    ],
    rows: [18],
  },
  { keys: ['ArrowLeft', 'ArrowLeft', 'Space'], rows: [] },
  {
    keys: [
      'ArrowLeft',
      'ArrowLeft',
      'ArrowLeft',
      'ArrowUp',
      'ArrowLeft',
      'Space',
    ],
    rows: [],
  },
  {
    keys: [
      'ArrowLeft',
      'ArrowLeft',
      'ArrowLeft',
      'ArrowUp',
      'ArrowUp',
      'Space',
    ],
    rows: [],
  },
  {
    keys: ['ArrowRight', 'ArrowRight', 'ArrowUp', 'ArrowUp', 'Space'],
    rows: [18, 19],
  },
] as const

async function expectHudDifficulty(
  page: import('@playwright/test').Page,
  label: string,
  multiplier: string,
) {
  await expect(page.locator('.difficulty-value > span:first-child')).toHaveText(
    label,
  )
  await expect(page.locator('.difficulty-multiplier')).toHaveText(multiplier)
}

async function expectGameFitsViewport(page: import('@playwright/test').Page) {
  const elements = [
    page.getByRole('img', { name: 'Block Drop board' }),
    page.getByLabel(/^Score:/),
    page.locator('.game-status'),
    page.locator('.game-progress'),
    page.getByRole('region', { name: /Held piece:/ }),
    page.getByRole('region', { name: /Next piece:/ }),
    page.locator('.game-controls'),
  ]

  for (const element of elements) {
    const box = await element.boundingBox()
    const description = await element.evaluate((node) =>
      node.getAttribute('aria-label') ||
      node.className ||
      node.tagName.toLowerCase(),
    )
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(
      box!.x + box!.width,
      `${description} extends beyond the viewport width`,
    ).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth))
    expect(box!.y + box!.height).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerHeight),
    )
  }

  const canvasBox = await elements[0].boundingBox()
  expect(canvasBox!.width / canvasBox!.height).toBeCloseTo(0.5, 2)
  const surfaceBox = await page.locator('.board-surface').boundingBox()
  expect(surfaceBox).not.toBeNull()
  expect(Math.abs(surfaceBox!.width - canvasBox!.width)).toBeLessThanOrEqual(4)
  expect(Math.abs(surfaceBox!.height - canvasBox!.height)).toBeLessThanOrEqual(4)
  const isStackedPhoneLayout = await page.evaluate(
    () =>
      window.innerWidth > 352 &&
      window.innerWidth <= 672 &&
      window.innerHeight > window.innerWidth,
  )
  if (isStackedPhoneLayout) {
    const hudBox = await page.locator('.game-hud').boundingBox()
    expect(hudBox).not.toBeNull()
    expect(surfaceBox!.y - (hudBox!.y + hudBox!.height)).toBeGreaterThanOrEqual(16)
  }
  expect(await page.locator('.action-controls button').count()).toBe(2)
  expect(await page.locator('.hold-controls button').count()).toBe(1)
  for (const button of await page.getByRole('button').all()) {
    const box = await button.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.x + box!.width).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    )
    expect(box!.y + box!.height).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerHeight),
    )
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= window.innerHeight,
    ),
  ).toBe(true)
}

async function expectSquareThemeCorners(
  page: import('@playwright/test').Page,
) {
  const roundedElements = await page.locator('.block-drop').evaluate(
    (root, selectors) =>
      selectors.flatMap((selector) =>
        Array.from(root.querySelectorAll(selector)).flatMap((element) => {
          const radius = Number.parseFloat(
            getComputedStyle(element).borderTopLeftRadius,
          )
          return radius > 0 ? [{ selector, radius }] : []
        }),
      ),
    [
      '.board-surface',
      '.board-surface canvas',
      '.game-hud',
      '.game-overlay-card',
      '.help-dialog',
      '.button-control',
      '.theme-option',
      '.theme-swatch',
      '.theme-swatch i',
      '.theme-selected-badge',
      '.next-piece-cell',
      '.game-over-scores > div',
      '.new-best-indicator',
      '.level-milestone-popup',
    ],
  )
  expect(roundedElements).toEqual([])
}

async function expectBoardHasNoFrame(page: import('@playwright/test').Page) {
  const frameStyles = await page.locator('.board-surface').evaluate((element) => {
    const styles = getComputedStyle(element)
    return {
      boxShadow: styles.boxShadow,
      outlineStyle: styles.outlineStyle,
    }
  })
  expect(frameStyles.boxShadow).toBe('none')
  expect(frameStyles.outlineStyle).toBe('none')
}

async function expectScoringGuideVisible(page: import('@playwright/test').Page) {
  const wasPlaying = await page
    .locator('.game-status')
    .getByText('Playing', { exact: true })
    .isVisible()
  if (wasPlaying) {
    await page.getByRole('button', { name: 'Pause game' }).click()
  }
  const pausePanel = page.getByRole('group', { name: 'Paused' })
  await expect(pausePanel.getByRole('button', { name: 'Help' })).toBeVisible()
  await expect(
    page.getByRole('group', { name: 'Session actions' }).getByRole('button', {
      name: 'Help',
    }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Help', exact: true }),
  ).toHaveCount(1)
  await pausePanel.getByRole('button', { name: 'Help' }).click()
  const dialog = page.getByRole('dialog', { name: 'Help' })
  await expect(dialog).toBeVisible()
  const headings = await dialog.getByRole('heading').allTextContents()
  expect(headings.slice(0, 3)).toEqual([
    'Help',
    'How to play',
    'Scoring and controls',
  ])
  await expect(
    dialog.getByText(/Each piece has four squares and falls from the top/),
  ).toBeVisible()
  await expect(
    dialog.getByText(/any part of a piece is still above the board when it lands/),
  ).toBeVisible()
  const closeButton = dialog.getByRole('button', { name: 'Close help' })
  await expect(closeButton).toBeVisible()
  const guide = dialog.getByRole('region', { name: 'Scoring', exact: true })
  await expect(guide).toBeVisible()
  for (const text of [
    'Soft drop',
    '+1 / row × difficulty',
    'Hard drop',
    '+2 / row × difficulty',
    'Gravity',
    '+0',
    'Lines cleared',
    '1: +100 × level × difficulty',
    '2: +300 × level × difficulty',
    '3: +500 × level × difficulty',
    '4: +800 × level × difficulty',
    'Difficulty multiplier: Easy 0.5×, Medium 1×, Hard 1.5×. Line-clear points also multiply by your level. Level increases every 10 lines and makes pieces fall faster.',
  ]) {
    await expect(guide.getByText(text, { exact: true })).toBeVisible()
  }
  await expect(dialog.getByText('Keyboard controls')).toBeVisible()
  await expect(dialog.getByText('Hold or swap the active piece')).toBeVisible()
  await expect(dialog.locator('dt').getByText('C', { exact: true })).toBeVisible()
  const viewportHeight = await page.evaluate(() => window.innerHeight)
  if (viewportHeight <= 320) {
    const content = dialog.locator('.help-dialog-content')
    const scrollMetrics = await content.evaluate((element) => ({
      clientHeight: element.clientHeight,
      paddingInlineEnd: Number.parseFloat(
        getComputedStyle(element).paddingInlineEnd,
      ),
      scrollHeight: element.scrollHeight,
    }))
    expect(scrollMetrics.paddingInlineEnd).toBeGreaterThanOrEqual(12)
    expect(scrollMetrics.scrollHeight).toBeGreaterThan(
      scrollMetrics.clientHeight,
    )
    await content.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    await expect(closeButton).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= window.innerHeight,
      ),
    ).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(pausePanel.getByRole('button', { name: 'Help' })).toBeFocused()
  await expect(page.locator('.game-status')).toHaveText('Paused')
  if (wasPlaying) {
    await pausePanel.getByRole('button', { name: 'Resume game' }).click()
  }
}

async function expectPreviewCentered(page: import('@playwright/test').Page) {
  const preview = page.getByRole('region', { name: /Next piece:/ })
  const frame = await preview.locator('.next-piece-grid').boundingBox()
  const shape = await preview.locator('.next-piece-shape').boundingBox()

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

async function expectMovementOrder(page: import('@playwright/test').Page) {
  const controls = [
    page.getByRole('button', { name: 'Move left' }),
    page.getByRole('button', { name: 'Move right' }),
    page.getByRole('button', { name: 'Soft drop' }),
    page.getByRole('button', { name: 'Hold piece' }),
    page.getByRole('button', { name: 'Rotate clockwise' }),
    page.getByRole('button', { name: 'Hard drop' }),
  ]
  expect(
    await page.locator('.game-controls button').evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute('aria-label')),
    ),
  ).toEqual([
    'Move left',
    'Move right',
    'Soft drop',
    'Hold piece',
    'Rotate clockwise',
    'Hard drop',
  ])
  const boxes = await Promise.all(
    controls.map((control) => control.boundingBox()),
  )
  for (const box of boxes) {
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
  const [left, right, softDrop, hold, rotate, hardDrop] = boxes
  const { width, height } = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  if (width <= 672 && height > width) {
    for (const box of boxes) {
      expect(box!.width).toBeGreaterThanOrEqual(56)
      expect(box!.height).toBeGreaterThanOrEqual(56)
    }
    const leftCluster = await page.locator('.movement-controls').boundingBox()
    const holdCluster = await page.locator('.hold-controls').boundingBox()
    const rightCluster = await page.locator('.action-controls').boundingBox()
    expect(leftCluster).not.toBeNull()
    expect(holdCluster).not.toBeNull()
    expect(rightCluster).not.toBeNull()
    expect(left!.y).toBeCloseTo(right!.y, 0)
    expect(softDrop!.y).toBeGreaterThan(left!.y)
    expect(rotate!.y).toBeCloseTo(left!.y, 0)
    expect(hardDrop!.y).toBeGreaterThan(rotate!.y)
    expect(hardDrop!.x).toBeCloseTo(rotate!.x, 0)
    expect(
      holdCluster!.x - (leftCluster!.x + leftCluster!.width),
    ).toBeGreaterThanOrEqual(16)
    expect(
      rightCluster!.x - (holdCluster!.x + holdCluster!.width),
    ).toBeGreaterThanOrEqual(16)
    expect(
      Math.abs(
        hold!.y +
          hold!.height / 2 -
          (rotate!.y + hardDrop!.y + hardDrop!.height) / 2,
      ),
    ).toBeLessThan(2)
    expect(left!.x + left!.width).toBeLessThanOrEqual(right!.x)
    expect(
      softDrop!.x + softDrop!.width / 2,
    ).toBeCloseTo(leftCluster!.x + leftCluster!.width / 2, 0)
    expect(leftCluster!.x + leftCluster!.width).toBeLessThan(hold!.x)
    expect(rotate!.x).toBeCloseTo(hardDrop!.x, 0)
  } else {
    for (const box of boxes) {
      expect(box!.y).toBeCloseTo(left!.y, 0)
    }
    expect(left!.x + left!.width).toBeLessThanOrEqual(right!.x)
    expect(right!.x + right!.width).toBeLessThanOrEqual(softDrop!.x)
    expect(softDrop!.x + softDrop!.width).toBeLessThanOrEqual(rotate!.x)
    expect(softDrop!.x + softDrop!.width).toBeLessThanOrEqual(hold!.x)
    expect(hold!.x + hold!.width).toBeLessThanOrEqual(rotate!.x)
    expect(rotate!.x + rotate!.width).toBeLessThanOrEqual(hardDrop!.x)
  }
}

async function finishSeededRun(page: import('@playwright/test').Page) {
  const gameOver = page.getByRole('group', { name: 'Game over' })
  for (let drop = 0; drop < 30 && !(await gameOver.isVisible()); drop += 1) {
    await page.keyboard.press('Space')
    await page.waitForTimeout(220)
  }
  await expect(gameOver).toBeVisible()
  await expect(page.getByRole('button', { name: 'Play again' })).toBeFocused()
}

test('prevents page panning from touch drags anywhere in Block Drop', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  const touchInput = await context.newCDPSession(page)

  try {
    await page.goto('http://127.0.0.1:4173/games/?game=block-drop')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Block Drop' }),
    ).toBeVisible()
    await expect(page.locator('.key-help')).toBeHidden()
    const mobileBoard = await page.getByRole('img', {
      name: 'Block Drop board',
    }).boundingBox()
    expect(mobileBoard!.height).toBeGreaterThanOrEqual(540)

    const scrollRange = await page.evaluate(() => {
      document.documentElement.style.overflow = 'auto'
      document.body.style.overflow = 'visible'
      const overflowArea = document.createElement('div')
      overflowArea.setAttribute('aria-hidden', 'true')
      overflowArea.style.cssText =
        'position:absolute;left:0;top:0;width:2000px;height:3000px;pointer-events:none;'
      document.body.append(overflowArea)
      return {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
        viewportWidth: document.documentElement.clientWidth,
        viewportHeight: document.documentElement.clientHeight,
      }
    })
    expect(scrollRange.width).toBeGreaterThan(scrollRange.viewportWidth)
    expect(scrollRange.height).toBeGreaterThan(scrollRange.viewportHeight)
    await expect(page.locator('.game-shell')).toHaveCSS(
      'touch-action',
      'pinch-zoom',
    )

    const targets = [
      page.locator('.game-header h1'),
      page.locator('.board-surface'),
      page.locator('.game-score'),
      page.locator('.game-status'),
      page.getByRole('region', { name: /Next piece:/ }),
      page.getByRole('button', { name: 'Move left' }),
      page.getByRole('button', { name: 'Pause game' }),
    ]

    for (const target of targets) {
      const box = await target.boundingBox()
      expect(box).not.toBeNull()
      const start = {
        x: box!.x + box!.width / 2,
        y: box!.y + box!.height / 2,
      }
      const before = await page.evaluate(() => ({
        x: window.scrollX,
        y: window.scrollY,
      }))

      for (const axis of ['horizontal', 'vertical'] as const) {
        if (axis === 'vertical' && start.y < 72) continue

        await touchInput.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ id: 1, ...start }],
        })
        await touchInput.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [
            {
              id: 1,
              x: axis === 'horizontal' ? Math.max(1, start.x - 70) : start.x,
              y: axis === 'vertical' ? start.y - 70 : start.y,
            },
          ],
        })
        await touchInput.send('Input.dispatchTouchEvent', {
          type: 'touchEnd',
          touchPoints: [],
        })
        await page.waitForTimeout(50)

        expect(
          await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY })),
        ).toEqual(before)
      }
    }
  } finally {
    await context.close()
  }
})

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
  await expect(page.getByText('Playing', { exact: true })).toBeVisible()
  await expect(page.locator('.game-progress')).toContainText('Level')
  await expect(page.locator('.game-progress')).toContainText('1')
  await expect(page.locator('.game-progress')).toContainText('Lines')
  await expect(page.locator('.game-progress')).toContainText('0')
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
  await expectScoringGuideVisible(page)
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
  const keyboardHelpVisible = await page.locator('.key-help').isVisible()
  expect(portraitHud!.height).toBeLessThanOrEqual(64)
  expect(portraitBoard!.height).toBeGreaterThanOrEqual(
    keyboardHelpVisible ? 504 : 524,
  )
  expect(portraitHud!.y + portraitHud!.height).toBeLessThanOrEqual(
    portraitBoard!.y,
  )
  const captureBoard = () =>
    canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL())
  const initialBoard = await captureBoard()

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
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
  await expect(page.locator('.game-status')).toHaveText('Paused')
  await expect(page.getByRole('button', { name: 'Move left' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Hard drop' })).toBeDisabled()
  const pausePanel = page.getByRole('group', { name: 'Paused' })
  await expect(
    pausePanel.getByRole('button', { name: 'Restart game' }),
  ).toBeEnabled()
  const pausedBoard = await captureBoard()
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.waitForTimeout(900)
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Space')
  expect(await captureBoard()).toBe(pausedBoard)

  await page.keyboard.press('p')
  await expect(page.locator('.game-status')).toHaveText('Playing')
  const resumedBoard = await captureBoard()
  await page.waitForTimeout(400)
  expect(await captureBoard()).toBe(resumedBoard)
  await expect.poll(captureBoard, { timeout: 1_000 }).not.toBe(resumedBoard)

  await page.getByRole('button', { name: 'Pause game' }).click()
  await page
    .getByRole('group', { name: 'Paused' })
    .getByRole('button', { name: 'Restart game' })
    .click()
  await expect(page.locator('.game-status')).toHaveText('Playing')
  await expect(page.getByLabel('Score: 0')).toBeVisible()

  await expectGameFitsViewport(page)

  await page.setViewportSize({ width: 844, height: 390 })
  await expect.poll(async () => (await canvas.boundingBox())?.height).toBeLessThan(
    390,
  )
  await expectGameFitsViewport(page)
  await expectPreviewCentered(page)
  await expectMovementOrder(page)
  await expectScoringGuideVisible(page)
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
  await expectMovementOrder(page)
  await expectScoringGuideVisible(page)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)

  await page.setViewportSize({ width: 320, height: 568 })
  await expectGameFitsViewport(page)
  await expectMovementOrder(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await expectGameFitsViewport(page)
  await expectMovementOrder(page)

  await expect(page.getByRole('button', { name: /catalog/i })).toHaveCount(0)
  await page.goBack()
  await expect(
    page.getByRole('button', { name: 'Play Block Drop' }),
  ).toBeVisible()
})

test('keeps SRS rotations playable at the side walls and near the floor', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    Date.now = () => 42
  })
  await page.goto('./')
  await page.getByRole('button', { name: 'Play Block Drop' }).click()

  for (let step = 0; step < 8; step += 1) {
    await page.keyboard.press('ArrowLeft')
  }
  for (let turn = 0; turn < 4; turn += 1) {
    await page.keyboard.press('ArrowUp')
  }
  await page.keyboard.press('Space')

  await expect(page.locator('.game-status')).toHaveText('Playing')
  for (let step = 0; step < 8; step += 1) {
    await page.keyboard.press('ArrowRight')
  }
  for (let turn = 0; turn < 4; turn += 1) {
    await page.keyboard.press('ArrowUp')
  }
  await page.keyboard.press('Space')

  await expect(page.locator('.game-status')).toHaveText('Playing')
  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press('ArrowDown')
  }
  for (let turn = 0; turn < 4; turn += 1) {
    await page.keyboard.press('ArrowUp')
  }
  await page.keyboard.press('Space')

  await expect(page.locator('.game-status')).toHaveText('Playing')
  await expect(page.getByLabel(/^Score:/)).not.toHaveText('Score: 0')
})

test('holds and swaps pieces with the C key and phone control', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    Date.now = () => 42
  })
  await page.goto('./')
  await page.getByRole('button', { name: 'Play Block Drop' }).click()

  const holdButton = page.getByRole('button', { name: 'Hold piece' })
  const holdSlot = page.locator('.hold-piece')
  const nextPreview = page.getByRole('region', { name: /Next piece:/ })
  const initialNext = await nextPreview.getAttribute('aria-label')
  await expect(holdSlot).toHaveAttribute('aria-label', 'Held piece: empty')
  await expect(holdSlot.locator('.next-piece-shape')).toHaveCount(0)
  await expect(holdButton).toHaveAttribute('aria-keyshortcuts', 'C')
  await expectGameFitsViewport(page)

  await page.keyboard.press('c')
  await expect(holdSlot).toHaveAttribute(
    'aria-label',
    /Held piece: [IJLOSTZ] tetromino/,
  )
  await expect(holdButton).toBeDisabled()
  await expect(nextPreview).not.toHaveAttribute('aria-label', initialNext!)

  const savedPiece = await holdSlot.getAttribute('aria-label')
  await page.keyboard.press('Space')
  await expect(holdButton).toBeEnabled()
  const beforeSwapNext = await nextPreview.getAttribute('aria-label')
  await holdButton.click()
  await expect(holdButton).toBeDisabled()
  await expect(holdSlot).not.toHaveAttribute('aria-label', savedPiece!)
  await expect(nextPreview).toHaveAttribute('aria-label', beforeSwapNext!)
})

test('presents a prominent right-side HUD and polished button states', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
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
  const preview = page
    .getByRole('region', { name: /Next piece:/ })
    .locator('.next-piece-grid')
  const canvasBox = await canvas.boundingBox()
  const hudBox = await hud.boundingBox()
  expect(hudBox!.x).toBeGreaterThanOrEqual(canvasBox!.x + canvasBox!.width)
  expect((await preview.boundingBox())!.width).toBeGreaterThanOrEqual(96)
  await expectScoringGuideVisible(page)
  await expectGameFitsViewport(page)
  await expectMovementOrder(page)
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

test('shows the seeded landing ghost in the cells hard drop will occupy', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    Date.now = () => 42
  })
  await page.goto('./')
  await page.getByRole('button', { name: 'Play Block Drop' }).click()
  await page.getByRole('button', { name: 'Pause game' }).click()

  const canvas = page.getByRole('img', { name: 'Block Drop board' })
  const samples = await canvas.evaluate((element: HTMLCanvasElement) => {
    const context = element.getContext('2d')!
    const cells = [
      [4, 18],
      [5, 18],
      [3, 19],
      [4, 19],
    ]
    const pixel = (x: number, y: number) =>
      Array.from(
        context.getImageData(
          Math.floor((x + 0.5) * (element.width / 10)),
          Math.floor((y + 0.5) * (element.height / 20)),
          1,
          1,
        ).data,
      )

    return {
      ghost: cells.map(([x, y]) => pixel(x, y)),
      empty: pixel(6, 19),
    }
  })

  expect(samples.ghost).toHaveLength(4)
  for (const [red, green, blue] of samples.ghost) {
    expect(green).toBeGreaterThan(samples.empty[1])
    expect(blue).toBeGreaterThan(samples.empty[2])
    expect(red).toBeGreaterThanOrEqual(samples.empty[0])
  }
  expect(samples.empty[1]).toBe(16)
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
  await expect(page.locator('.level-milestone-popup')).toHaveCount(0)
  await expect(page.getByText('Clearing lines', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Move left' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Pause game' })).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Restart game' }),
  ).toHaveCount(0)
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('p')
  await expect(page.getByText('Clearing lines', { exact: true })).toBeVisible()
  await expect(canvas).toHaveAttribute('data-clearing-rows', '14')
  await page.waitForTimeout(220)
  await expect(canvas).toHaveAttribute('data-clearing-rows', '14')
  await page.screenshot({
    path: 'test-results/block-drop-themes/phone-classic-clearing.png',
  })
  await expect(page.locator('.line-clear-callout')).toHaveText('+100 · Single')
  await expect(page.locator('.game-progress')).toContainText('1')
  await expect(canvas).not.toHaveAttribute('data-clearing-rows')
  await expect(page.locator('.game-status')).toHaveText('Playing')
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

test('shows Tron grid and scanline clear on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    Date.now = () => 42
  })
  await page.goto('./')
  await page.evaluate(() => {
    window.localStorage.setItem('games.block-drop.theme', 'tron')
  })
  await page.getByRole('button', { name: 'Play Block Drop' }).click()

  const game = page.locator('.block-drop')
  const canvas = page.getByRole('img', { name: 'Block Drop board' })
  await expect(game).toHaveAttribute('data-theme', 'tron')
  await expectGameFitsViewport(page)
  await expectSquareThemeCorners(page)
  await page.screenshot({
    path: 'test-results/block-drop-themes/phone-tron-playing.png',
  })

  await page.getByRole('button', { name: 'Pause game' }).click()
  await expect(page.getByRole('group', { name: 'Paused' })).toBeVisible()
  await page.screenshot({
    path: 'test-results/block-drop-themes/phone-tron-paused.png',
  })
  await page
    .getByRole('group', { name: 'Paused' })
    .getByRole('button', { name: 'Resume game' })
    .click()

  for (const step of doubleLineClearSteps) {
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
    }, step.keys)

    if (step.rows.length === 1) {
      await expect(canvas).toHaveAttribute(
        'data-clearing-rows',
        step.rows.join(','),
      )
      await expect(canvas).not.toHaveAttribute('data-clearing-rows')
    } else if (step.rows.length > 1) {
      await expect(canvas).toHaveAttribute('data-clearing-rows', '18,19')
      await expect(page.locator('.line-clear-callout')).toHaveText(
        '+300 · Double',
      )
      await page.waitForTimeout(220)
      await expect(canvas).toHaveAttribute('data-clearing-rows', '18,19')
      await page.screenshot({
        path: 'test-results/block-drop-themes/phone-tron-scanline.png',
      })
      await expect(canvas).not.toHaveAttribute('data-clearing-rows')
    }
  }
})

test('shows the Chocolate stacked melt effect during a phone double-line clear', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    Date.now = () => 42
  })
  await page.goto('./')
  await page.evaluate(() => {
    window.localStorage.setItem('games.block-drop.theme', 'chocolate')
  })
  await page.getByRole('button', { name: 'Play Block Drop' }).click()

  const game = page.locator('.block-drop')
  const canvas = page.getByRole('img', { name: 'Block Drop board' })
  await expect(game).toHaveAttribute('data-theme', 'chocolate')
  for (const step of doubleLineClearSteps) {
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
    }, step.keys)

    if (step.rows.length === 1) {
      await expect(canvas).toHaveAttribute(
        'data-clearing-rows',
        step.rows.join(','),
      )
      await expect(canvas).not.toHaveAttribute(
        'data-clearing-rows',
        step.rows.join(','),
      )
    } else if (step.rows.length > 1) {
      await expect(canvas).toHaveAttribute(
        'data-clearing-rows',
        step.rows.join(','),
      )
      await expect(page.locator('.line-clear-callout')).toHaveText(
        '+300 · Double',
      )
      await page.waitForTimeout(560)
      await expect(canvas).toHaveAttribute('data-clearing-rows', '18,19')
    }
  }
  await page.screenshot({
    path: 'test-results/block-drop-themes/phone-chocolate-melting.png',
  })
  await expect(canvas).not.toHaveAttribute('data-clearing-rows')
})

test('shows Nature leaves drifting during a phone double-line clear', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    Date.now = () => 42
  })
  await page.goto('./')
  await page.evaluate(() => {
    window.localStorage.setItem('games.block-drop.theme', 'nature')
  })
  await page.getByRole('button', { name: 'Play Block Drop' }).click()

  const game = page.locator('.block-drop')
  const canvas = page.getByRole('img', { name: 'Block Drop board' })
  await expect(game).toHaveAttribute('data-theme', 'nature')
  await expectGameFitsViewport(page)
  await expectSquareThemeCorners(page)
  await page.screenshot({
    path: 'test-results/block-drop-themes/phone-nature-playing.png',
  })
  await page.getByRole('button', { name: 'Pause game' }).click()
  await expect(page.getByRole('group', { name: 'Paused' })).toBeVisible()
  await expectSquareThemeCorners(page)
  await page.screenshot({
    path: 'test-results/block-drop-themes/phone-nature-paused.png',
  })
  await page
    .getByRole('group', { name: 'Paused' })
    .getByRole('button', { name: 'Resume game' })
    .click()
  await expect(page.locator('.game-status')).toHaveText('Playing')

  for (const step of doubleLineClearSteps) {
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
    }, step.keys)

    if (step.rows.length === 1) {
      await expect(canvas).toHaveAttribute(
        'data-clearing-rows',
        step.rows.join(','),
      )
      await expect(canvas).not.toHaveAttribute('data-clearing-rows')
    } else if (step.rows.length > 1) {
      await expect(canvas).toHaveAttribute(
        'data-clearing-rows',
        step.rows.join(','),
      )
      await expect(page.locator('.line-clear-callout')).toHaveText(
        '+300 · Double',
      )
      await page.waitForTimeout(340)
      await expect(canvas).toHaveAttribute('data-clearing-rows', '18,19')
      await page.screenshot({
        path: 'test-results/block-drop-themes/phone-nature-leaf-fall.png',
      })
      await expect(canvas).not.toHaveAttribute('data-clearing-rows')
    }
  }
})

test('shows Sketchbook pencil hatching and the eraser clear on a phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    Date.now = () => 42
  })
  await page.goto('./')
  await page.evaluate(() => {
    window.localStorage.setItem('games.block-drop.theme', 'sketchbook')
  })
  await page.getByRole('button', { name: 'Play Block Drop' }).click()

  const game = page.locator('.block-drop')
  const canvas = page.getByRole('img', { name: 'Block Drop board' })
  await expect(game).toHaveAttribute('data-theme', 'sketchbook')
  await expectGameFitsViewport(page)
  await expectBoardHasNoFrame(page)
  await expectSquareThemeCorners(page)

  const preview = page.locator('.next-piece-cell.is-filled').first()
  const previewStyles = await preview.evaluate((element) => {
    const styles = getComputedStyle(element)
    return {
      backgroundImage: styles.backgroundImage,
      borderColor: styles.borderColor,
      borderWidth: styles.borderWidth,
    }
  })
  expect(previewStyles.backgroundImage).toContain('repeating-linear-gradient')
  expect(previewStyles.borderColor).toBe('rgb(58, 58, 58)')
  expect(previewStyles.borderWidth).toBe('2px')
  await page.screenshot({
    path: 'test-results/block-drop-themes/phone-sketchbook-playing.png',
  })

  await page.getByRole('button', { name: 'Pause game' }).click()
  const pause = page.getByRole('group', { name: 'Paused' })
  await expect(pause).toBeVisible()
  await expectSquareThemeCorners(page)
  const disabledControl = page.locator('.game-controls .button-control').first()
  await expect(disabledControl).toBeDisabled()
  const disabledStyles = await disabledControl.evaluate((element) => {
    const styles = getComputedStyle(element)
    return { borderStyle: styles.borderStyle, opacity: styles.opacity }
  })
  expect(disabledStyles).toEqual({ borderStyle: 'dashed', opacity: '0.46' })

  const sketchbookOption = pause.locator(
    'label[data-theme-option="sketchbook"]',
  )
  await page.keyboard.press('Tab')
  await sketchbookOption.getByRole('radio', { name: 'Sketchbook' }).focus()
  const focusStyles = await sketchbookOption.evaluate((element) => {
    const styles = getComputedStyle(element)
    return {
      outlineColor: styles.outlineColor,
      outlineStyle: styles.outlineStyle,
      outlineWidth: styles.outlineWidth,
    }
  })
  expect(focusStyles).toEqual({
    outlineColor: 'rgb(31, 111, 209)',
    outlineStyle: 'solid',
    outlineWidth: '3px',
  })
  await page.screenshot({
    path: 'test-results/block-drop-themes/phone-sketchbook-paused.png',
  })

  const resumeButton = pause.getByRole('button', { name: 'Resume game' })
  const resumeBox = await resumeButton.boundingBox()
  expect(resumeBox).not.toBeNull()
  await page.mouse.move(
    resumeBox!.x + resumeBox!.width / 2,
    resumeBox!.y + resumeBox!.height / 2,
  )
  await page.mouse.down()
  expect(
    await resumeButton.evaluate((element) =>
      getComputedStyle(element).boxShadow.includes('inset'),
    ),
  ).toBe(true)
  await page.mouse.up()
  await expect(page.locator('.game-status')).toHaveText('Playing')

  for (const step of doubleLineClearSteps) {
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
    }, step.keys)

    if (step.rows.length === 1) {
      await expect(canvas).toHaveAttribute(
        'data-clearing-rows',
        step.rows.join(','),
      )
      await expect(canvas).not.toHaveAttribute('data-clearing-rows')
    } else if (step.rows.length > 1) {
      await expect(canvas).toHaveAttribute(
        'data-clearing-rows',
        step.rows.join(','),
      )
      await expect(page.locator('.line-clear-callout')).toHaveText(
        '+300 · Double',
      )
      await page.waitForTimeout(220)
      await expect(canvas).toHaveAttribute('data-clearing-rows', '18,19')
      await page.screenshot({
        path: 'test-results/block-drop-themes/phone-sketchbook-eraser.png',
      })
      await expect(canvas).not.toHaveAttribute('data-clearing-rows')
    }
  }
})

test('shows Stained Glass panes and the shatter clear on a phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    Date.now = () => 42
  })
  await page.goto('./')
  await page.evaluate(() => {
    window.localStorage.setItem('games.block-drop.theme', 'stained-glass')
  })
  await page.getByRole('button', { name: 'Play Block Drop' }).click()

  const game = page.locator('.block-drop')
  const canvas = page.getByRole('img', { name: 'Block Drop board' })
  await expect(game).toHaveAttribute('data-theme', 'stained-glass')
  await expectGameFitsViewport(page)
  await expectBoardHasNoFrame(page)
  await expectSquareThemeCorners(page)

  const preview = page.locator('.next-piece-cell.is-filled').first()
  const previewStyles = await preview.evaluate((element) => {
    const styles = getComputedStyle(element)
    return {
      backgroundImage: styles.backgroundImage,
      borderRadius: styles.borderTopLeftRadius,
    }
  })
  expect(previewStyles.backgroundImage).toContain('linear-gradient')
  expect(previewStyles.borderRadius).toBe('0px')
  await page.screenshot({
    path: 'test-results/block-drop-themes/phone-stained-glass-playing.png',
  })

  await page.getByRole('button', { name: 'Pause game' }).click()
  const pause = page.getByRole('group', { name: 'Paused' })
  await expect(pause).toBeVisible()
  await expectSquareThemeCorners(page)
  await page.screenshot({
    path: 'test-results/block-drop-themes/phone-stained-glass-paused.png',
  })
  await pause.getByRole('button', { name: 'Resume game' }).click()
  await expect(page.locator('.game-status')).toHaveText('Playing')

  for (const step of doubleLineClearSteps) {
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
    }, step.keys)

    if (step.rows.length === 1) {
      await expect(canvas).toHaveAttribute(
        'data-clearing-rows',
        step.rows.join(','),
      )
      await expect(canvas).not.toHaveAttribute('data-clearing-rows')
    } else if (step.rows.length > 1) {
      await expect(canvas).toHaveAttribute('data-clearing-rows', '18,19')
      await expect(page.locator('.line-clear-callout')).toHaveText(
        '+300 · Double',
      )
      await page.waitForTimeout(140)
      await page.screenshot({
        path: 'test-results/block-drop-themes/phone-stained-glass-cracks.png',
      })
      await page.waitForTimeout(40)
      await expect(canvas).toHaveAttribute('data-clearing-rows', '18,19')
      await page.screenshot({
        path: 'test-results/block-drop-themes/phone-stained-glass-shatter.png',
      })
      await expect(canvas).not.toHaveAttribute('data-clearing-rows')
    }
  }
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

test('scales drop points by pause difficulty and preserves fractional scores', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./?game=block-drop')

  await page.getByRole('button', { name: 'Pause game' }).click()
  const pause = page.getByRole('group', { name: 'Paused' })
  const difficulty = pause.getByRole('slider', { name: 'Difficulty' })
  await difficulty.press('Home')
  await expect(difficulty).toHaveAttribute('aria-valuetext', 'Easy, half speed')
  await pause.getByRole('button', { name: 'Resume game' }).click()

  await page.keyboard.press('ArrowDown')
  await expect(page.getByLabel('Score: 0.5')).toBeVisible()

  await page.getByRole('button', { name: 'Pause game' }).click()
  const pausedAgain = page.getByRole('group', { name: 'Paused' })
  const difficultyAgain = pausedAgain.getByRole('slider', { name: 'Difficulty' })
  await difficultyAgain.press('End')
  await expect(difficultyAgain).toHaveAttribute(
    'aria-valuetext',
    'Hard, 1.5× speed',
  )
  await expect(page.getByLabel('Score: 0.5')).toBeVisible()
  await pausedAgain.getByRole('button', { name: 'Resume game' }).click()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByLabel('Score: 2')).toBeVisible()

  await page.getByRole('button', { name: 'Pause game' }).click()
  await page.getByRole('group', { name: 'Paused' })
    .getByRole('button', { name: 'Restart game' })
    .click()
  await expect(page.getByLabel('Score: 0')).toBeVisible()

  await page.getByRole('button', { name: 'Pause game' }).click()
  await expect(
    page.getByRole('group', { name: 'Paused' }).getByRole('slider', {
      name: 'Difficulty',
    }),
  ).toHaveAttribute('aria-valuetext', 'Hard, 1.5× speed')
  await page.getByRole('group', { name: 'Paused' })
    .getByRole('button', { name: 'Resume game' })
    .click()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByLabel('Score: 1.5')).toBeVisible()
})

test('shows the selected difficulty and restores it after reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./?game=block-drop')
  await expectHudDifficulty(page, 'Medium', '1×')

  await page.getByRole('button', { name: 'Pause game' }).click()
  const pause = page.getByRole('group', { name: 'Paused' })
  const slider = pause.getByRole('slider', { name: 'Difficulty' })
  await slider.press('End')
  await expectHudDifficulty(page, 'Hard', '1.5×')
  await pause.getByRole('button', { name: 'Resume game' }).click()
  await expectGameFitsViewport(page)

  await page.reload()
  await expectHudDifficulty(page, 'Hard', '1.5×')
  await page.getByRole('button', { name: 'Pause game' }).click()
  await expect(
    page.getByRole('group', { name: 'Paused' }).getByRole('slider', {
      name: 'Difficulty',
    }),
  ).toHaveAttribute('aria-valuetext', 'Hard, 1.5× speed')
  await page.getByRole('group', { name: 'Paused' })
    .getByRole('button', { name: 'Resume game' })
    .click()

  await page.setViewportSize({ width: 320, height: 568 })
  await expectHudDifficulty(page, 'Hard', '1.5×')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('selects a theme while paused and restores it after reload and Back', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  await page.evaluate(() => {
    window.localStorage.setItem('games.block-drop.theme', 'not-a-theme')
  })
  await page.getByRole('button', { name: 'Play Block Drop' }).click()

  const game = page.locator('.block-drop')
  await expect(game).toHaveAttribute('data-theme', 'classic')
  await expectBoardHasNoFrame(page)
  await expectSquareThemeCorners(page)
  await expectGameFitsViewport(page)
  await page.getByRole('button', { name: 'Pause game' }).click()
  const pause = page.getByRole('group', { name: 'Paused' })
  const themeGroup = pause.getByRole('group', { name: /^Theme/ })
  await expect(themeGroup.locator('output')).toHaveText('Selected: Classic')
  expect(
    await themeGroup.evaluate((element) =>
      element.previousElementSibling?.classList.contains('overlay-actions'),
    ),
  ).toBe(true)
  expect(
    await themeGroup.locator('.theme-options').evaluate((element) =>
      getComputedStyle(element).gridTemplateColumns.split(' ').length,
    ),
  ).toBe(1)
  await expect(themeGroup.getByRole('radio')).toHaveCount(6)
  await expect(themeGroup.getByRole('radio', { name: 'Classic' })).toBeChecked()
  await expect(
    themeGroup.getByRole('radio', { name: 'Chocolate' }),
  ).not.toBeChecked()
  await expect(
    themeGroup.locator('[data-selected="true"] .theme-selected-badge'),
  ).toHaveText('Selected')
  await expectSquareThemeCorners(page)
  await page.screenshot({
    path: 'test-results/block-drop-themes/phone-classic-paused.png',
  })

  await pause.locator('label[data-theme-option="tron"]').click()
  await expect(game).toHaveAttribute('data-theme', 'tron')
  await expectSquareThemeCorners(page)
  await pause.locator('label[data-theme-option="classic"]').click()
  await expect(game).toHaveAttribute('data-theme', 'classic')

  await pause.locator('label[data-theme-option="nature"]').click()
  await expect(game).toHaveAttribute('data-theme', 'nature')
  await expectSquareThemeCorners(page)
  await pause.locator('label[data-theme-option="sketchbook"]').click()
  await expect(game).toHaveAttribute('data-theme', 'sketchbook')
  await expectSquareThemeCorners(page)
  await pause.locator('label[data-theme-option="stained-glass"]').click()
  await expect(game).toHaveAttribute('data-theme', 'stained-glass')
  await expectSquareThemeCorners(page)
  await pause.locator('label[data-theme-option="classic"]').click()
  await expect(game).toHaveAttribute('data-theme', 'classic')

  await pause.getByRole('button', { name: 'Restart game' }).click()
  await expect(page.locator('.game-status')).toHaveText('Playing')
  await expect(game).toHaveAttribute('data-theme', 'classic')
  await expect(page.locator('.board-surface')).toBeFocused()
  await expectBoardHasNoFrame(page)
  await page.screenshot({
    path: 'test-results/block-drop-themes/phone-classic-playing.png',
  })
  await page.getByRole('button', { name: 'Pause game' }).click()

  const initialState = {
    score: await page.locator('.game-score-value').textContent(),
    progress: await page.locator('.game-progress').textContent(),
    status: await page.locator('.game-status').textContent(),
  }
  await pause.locator('label[data-theme-option="chocolate"]').click()
  await expect(game).toHaveAttribute('data-theme', 'chocolate')
  await expect(
    themeGroup.getByRole('radio', { name: 'Chocolate' }),
  ).toBeChecked()
  await expect(themeGroup.locator('output')).toHaveText('Selected: Chocolate')
  await expect(
    themeGroup.locator('[data-selected="true"] .theme-option-label'),
  ).toHaveText('Chocolate')
  await expectSquareThemeCorners(page)
  await page.screenshot({
    path: 'test-results/block-drop-themes/phone-chocolate-paused.png',
  })
  await expect(page.locator('.game-status')).toHaveText(initialState.status!)
  await expect(page.locator('.game-score-value')).toHaveText(initialState.score!)
  await expect(page.locator('.game-progress')).toHaveText(initialState.progress!)
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    '#1b0f0a',
  )
  expect(
    await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
  ).toBe('rgb(27, 15, 10)')
  const cardMetrics = await pause
    .locator('.game-overlay-card')
    .evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }))
  expect(cardMetrics.scrollHeight).toBeLessThanOrEqual(cardMetrics.clientHeight)

  await pause.getByRole('button', { name: 'Restart game' }).click()
  await expect(page.locator('.game-status')).toHaveText('Playing')
  await expect(game).toHaveAttribute('data-theme', 'chocolate')
  await expect(page.locator('.board-surface')).toBeFocused()
  await expectBoardHasNoFrame(page)
  await page.screenshot({
    path: 'test-results/block-drop-themes/phone-chocolate-playing.png',
  })
  expect(await page.evaluate(() => localStorage.getItem('games.block-drop.theme')))
    .toBe('chocolate')

  await page.getByRole('button', { name: 'Pause game' }).click()
  await page.setViewportSize({ width: 568, height: 320 })
  const shortPause = page.getByRole('group', { name: 'Paused' })
  const shortCardMetrics = await shortPause
    .locator('.game-overlay-card')
    .evaluate((element) => ({
      clientHeight: element.clientHeight,
      overflowY: getComputedStyle(element).overflowY,
      scrollHeight: element.scrollHeight,
    }))
  expect(shortCardMetrics.scrollHeight).toBeGreaterThan(
    shortCardMetrics.clientHeight,
  )
  expect(shortCardMetrics.overflowY).toBe('auto')
  await shortPause.getByRole('button', { name: 'Help' }).scrollIntoViewIfNeeded()

  await pause.getByRole('button', { name: 'Resume game' }).click()
  await page.reload()
  await expect(game).toHaveAttribute('data-theme', 'chocolate')
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    '#1b0f0a',
  )
  await page.getByRole('button', { name: 'Pause game' }).click()
  const restoredThemeGroup = page
    .getByRole('group', { name: 'Paused' })
    .getByRole('group', { name: /^Theme/ })
  await expect(
    restoredThemeGroup.getByRole('radio', { name: 'Chocolate' }),
  ).toBeChecked()

  await page.goBack()
  await expect(page.getByRole('button', { name: 'Play Block Drop' })).toBeVisible()
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-block-drop-theme',
  )
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    '#162033',
  )
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).backgroundColor,
    ),
  ).toBe('rgb(7, 17, 31)')
})

test('styles a level-milestone popup with the active theme and reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  await page.evaluate(() => {
    window.localStorage.setItem('games.block-drop.theme', 'chocolate')
  })
  await page.getByRole('button', { name: 'Play Block Drop' }).click()

  await page.locator('.board-frame').evaluate((frame) => {
    const popup = document.createElement('div')
    popup.className = 'level-milestone-popup'
    popup.setAttribute('aria-hidden', 'true')
    popup.textContent = '10 lines cleared!'
    frame.append(popup)
  })

  const popup = page.locator('.level-milestone-popup')
  await expect(popup).toHaveText('10 lines cleared!')
  await page.waitForTimeout(250)
  const popupStyle = await popup.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      animationName: style.animationName,
      backgroundImage: style.backgroundImage,
      borderColor: style.borderColor,
      borderRadius: Number.parseFloat(style.borderTopLeftRadius),
      borderWidth: Number.parseFloat(style.borderTopWidth),
      fontSize: Number.parseFloat(style.fontSize),
      paddingTop: Number.parseFloat(style.paddingTop),
      paddingRight: Number.parseFloat(style.paddingRight),
    }
  })
  expect(popupStyle.animationName).toBe('level-milestone-popup')
  expect(popupStyle.backgroundImage).not.toBe('none')
  expect(popupStyle.borderColor).toBe('rgb(184, 145, 63)')
  expect(popupStyle.borderWidth).toBe(2)
  expect(popupStyle.fontSize).toBeCloseTo(390 * 0.064)
  expect(popupStyle.paddingTop).toBeCloseTo(16 * 1.1)
  expect(popupStyle.paddingRight).toBeCloseTo(16 * 1.7)
  expect(popupStyle.borderRadius).toBe(0)
  await expectSquareThemeCorners(page)
  await page.locator('.board-frame').screenshot({
    path: 'test-results/block-drop-themes/phone-chocolate-milestone-popup.png',
  })

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect
    .poll(() => popup.evaluate((element) => getComputedStyle(element).animationName))
    .toBe('none')
  const popupBox = await popup.boundingBox()
  const boardBox = await page.locator('.board-frame').boundingBox()
  expect(popupBox).not.toBeNull()
  expect(boardBox).not.toBeNull()
  expect(popupBox!.x).toBeGreaterThanOrEqual(boardBox!.x)
  expect(popupBox!.x + popupBox!.width).toBeLessThanOrEqual(
    boardBox!.x + boardBox!.width,
  )
})

test('keeps the best score through reload and offline relaunch', async ({
  context,
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    Date.now = () => 42
  })
  await page.goto('./?game=block-drop')
  await page.evaluate(() => window.localStorage.clear())

  await finishSeededRun(page)
  const card = page.getByRole('group', { name: 'Game over' })
  const scores = card.locator('.game-over-scores dd')
  let bestScore = Number(await scores.nth(1).textContent())
  expect(bestScore).toBeGreaterThan(0)
  await expect(card.getByText('New best')).toBeVisible()
  await expect(scores.nth(0)).toHaveText(String(bestScore))
  await expect(scores.nth(1)).toHaveText(String(bestScore))
  await expect(
    card.getByRole('button', { name: 'Back to catalog' }),
  ).toHaveCount(0)
  await expect(page.getByRole('button', { name: /catalog/i })).toHaveCount(0)
  await expectGameFitsViewport(page)

  await page.keyboard.press('r')
  await expect(page.getByText('Playing', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Score: 0')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Block Drop playfield' }))
    .toBeFocused()

  await page.reload()
  await finishSeededRun(page)
  const reloadedCard = page.getByRole('group', { name: 'Game over' })
  const reloadedScores = reloadedCard.locator('.game-over-scores dd')
  const reloadedFinalScore = Number(await reloadedScores.nth(0).textContent())
  const reloadedBestScore = Number(await reloadedScores.nth(1).textContent())
  expect(reloadedBestScore).toBeGreaterThanOrEqual(bestScore)
  expect(reloadedBestScore).toBeGreaterThanOrEqual(reloadedFinalScore)
  if (reloadedBestScore > bestScore) {
    await expect(reloadedCard.getByText('New best')).toBeVisible()
  } else {
    await expect(reloadedCard.getByText('New best')).toHaveCount(0)
  }
  bestScore = reloadedBestScore

  await reloadedCard.getByRole('button', { name: 'Play again' }).click()
  await expect(page.getByText('Playing', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Score: 0')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Block Drop playfield' }))
    .toBeFocused()

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        })
      })
    }
  })
  await context.setOffline(true)
  await page.reload()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Block Drop' }),
  ).toBeVisible()
  await finishSeededRun(page)
  const offlineCard = page.getByRole('group', { name: 'Game over' })
  const offlineScores = offlineCard.locator('.game-over-scores dd')
  const offlineFinalScore = Number(await offlineScores.nth(0).textContent())
  const offlineBestScore = Number(await offlineScores.nth(1).textContent())
  expect(offlineBestScore).toBeGreaterThanOrEqual(bestScore)
  expect(offlineBestScore).toBeGreaterThanOrEqual(offlineFinalScore)
  if (offlineBestScore > bestScore) {
    await expect(offlineCard.getByText('New best')).toBeVisible()
  } else {
    await expect(offlineCard.getByText('New best')).toHaveCount(0)
  }
})
