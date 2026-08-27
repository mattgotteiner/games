import { expect, test } from '@playwright/test'

test('loads the repository-scoped shell offline after its first online visit', async ({
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
  await expect(page.getByText('No games yet')).toBeVisible()
  await expect(page.getByRole('button', { name: /play/i })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /play/i })).toHaveCount(0)
})
