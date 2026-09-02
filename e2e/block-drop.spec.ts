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
