import { expect, test } from '@playwright/test'

test('plays Block Drop with touch and keyboard across phone orientations', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
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
  await expect(preview.locator('.next-piece-cell')).toHaveCount(16)
  await expect(preview.locator('.next-piece-cell.is-filled')).toHaveCount(4)
  const initialPreview = await preview.getAttribute('aria-label')
  const initialPreviewGrid = await preview.locator('.next-piece-grid').innerHTML()

  const canvas = page.getByRole('img', { name: 'Block Drop board' })
  await expect(canvas).toBeVisible()
  await expect(page.getByRole('button', { name: 'Move left' })).toBeEnabled()
  const captureBoard = () =>
    canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL())
  const initialBoard = await captureBoard()

  await page.keyboard.press('ArrowLeft')
  const keyboardBoard = await captureBoard()
  expect(keyboardBoard).not.toBe(initialBoard)

  await page.getByRole('button', { name: 'Move right' }).click()
  const touchBoard = await captureBoard()
  expect(touchBoard).not.toBe(keyboardBoard)

  await page.keyboard.press('Space')
  await expect(preview).not.toHaveAttribute('aria-label', initialPreview!)
  await expect(preview.locator('.next-piece-cell.is-filled')).toHaveCount(4)
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
  await expect(page.getByText('Score: 0')).toBeVisible()

  const portraitBox = await canvas.boundingBox()
  expect(portraitBox).not.toBeNull()
  expect(portraitBox!.width).toBeLessThanOrEqual(390)
  expect(portraitBox!.height).toBeLessThanOrEqual(844)

  await page.setViewportSize({ width: 844, height: 390 })
  await expect
    .poll(async () => (await canvas.boundingBox())?.height)
    .toBeLessThanOrEqual(390)

  await page.getByRole('button', { name: /catalog/i }).click()
  await expect(
    page.getByRole('button', { name: 'Play Block Drop' }),
  ).toBeVisible()
})
