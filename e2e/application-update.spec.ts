import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { expect, test, type Page } from '@playwright/test'

const viteCli = resolve('node_modules', 'vite', 'bin', 'vite.js')

function buildVersion(version: string) {
  execFileSync(process.execPath, [viteCli, 'build'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      VITE_APPLICATION_BUILD: version,
    },
    stdio: 'pipe',
  })
}

async function waitForServiceWorkerControl(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolveControl) => {
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => resolveControl(),
          { once: true },
        )
      })
    }
  })
}

test('announces a stale copy before loading a new production build', async ({
  page,
}) => {
  buildVersion('stale-copy')
  await page.goto('./')
  await waitForServiceWorkerControl(page)
  await expect(page.locator('.app-shell')).toHaveAttribute(
    'data-application-build',
    'stale-copy',
  )

  let mainFrameNavigations = 0
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      mainFrameNavigations += 1
    }
  })

  buildVersion('latest-copy')
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    const updateFound = new Promise<void>((resolveUpdate) => {
      registration.addEventListener('updatefound', () => resolveUpdate(), {
        once: true,
      })
    })
    await registration.update()
    await updateFound
  })

  await expect(page.getByRole('status')).toContainText(
    'This copy is out of date. Downloading the latest version',
  )
  await expect(page.getByRole('status')).toContainText(
    'The latest version has downloaded. Loading the new copy',
  )
  await expect(page.locator('.app-shell')).toHaveAttribute(
    'data-application-build',
    'latest-copy',
  )
  expect(mainFrameNavigations).toBe(1)
})
