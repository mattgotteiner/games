import { expect, test } from '@playwright/test'

test('launches Block Drop from the repository-scoped app offline', async ({
  context,
  page,
}) => {
  await page.goto('./')

  const manifestPath = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(new URL(manifestPath!, page.url()).pathname).toBe(
    '/games/manifest.webmanifest',
  )

  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    const response = await fetch(link!.href)
    return response.json() as Promise<{
      icons: { src: string }[]
      scope: string
      start_url: string
    }>
  })

  expect(manifest.scope).toBe('/games/')
  expect(manifest.start_url).toBe('/games/')
  expect(
    manifest.icons.every(
      ({ src }) => new URL(src, page.url()).pathname.startsWith('/games/icons/'),
    ),
  ).toBe(true)
  for (const { src } of manifest.icons) {
    const response = await page.request.get(new URL(src, page.url()).toString())
    expect(response.ok()).toBe(true)
  }

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

  const serviceWorker = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    return {
      scope: registration.scope,
      scriptURL: registration.active!.scriptURL,
    }
  })
  expect(new URL(serviceWorker.scope).pathname).toBe('/games/')
  expect(new URL(serviceWorker.scriptURL).pathname).toBe('/games/sw.js')

  await context.setOffline(true)
  await page.reload()

  await expect(page.getByRole('heading', { level: 1, name: 'Games' })).toBeVisible()
  await page.getByRole('button', { name: 'Play Block Drop' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Block Drop' }),
  ).toBeVisible()
  const canvas = page.getByRole('img', { name: 'Block Drop board' })
  const moveLeft = page.getByRole('button', { name: 'Move left' })
  await expect(moveLeft).toBeEnabled()
  const before = await canvas.evaluate((element: HTMLCanvasElement) =>
    element.toDataURL(),
  )

  await moveLeft.click()
  await expect
    .poll(() =>
      canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL()),
    )
    .not.toBe(before)
})
