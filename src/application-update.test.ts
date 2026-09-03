import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createApplicationUpdateController,
  type InstallingWorker,
  type RegisterServiceWorkerOptions,
  type UpdateRegistration,
} from './application-update'

class FakeInstallingWorker implements InstallingWorker {
  state: ServiceWorkerState = 'installing'
  private readonly listeners = new Set<() => void>()

  addEventListener(_type: 'statechange', listener: () => void) {
    this.listeners.add(listener)
  }

  removeEventListener(_type: 'statechange', listener: () => void) {
    this.listeners.delete(listener)
  }

  moveTo(state: ServiceWorkerState) {
    this.state = state
    this.listeners.forEach((listener) => listener())
  }
}

class FakeUpdateRegistration implements UpdateRegistration {
  private readonly listeners = new Set<() => void>()

  constructor(public installing: InstallingWorker | null) {}

  addEventListener(_type: 'updatefound', listener: () => void) {
    this.listeners.add(listener)
  }

  findUpdate(worker: InstallingWorker) {
    this.installing = worker
    this.listeners.forEach((listener) => listener())
  }
}

describe('application update controller', () => {
  let callbacks: RegisterServiceWorkerOptions
  let updateServiceWorker = vi.fn<() => Promise<void>>()
  let controllerWorker: FakeInstallingWorker | null
  let publishControllerChange: () => void
  let reload = vi.fn<() => void>()

  beforeEach(() => {
    vi.useFakeTimers()
    callbacks = {}
    updateServiceWorker = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    controllerWorker = new FakeInstallingWorker()
    controllerWorker.moveTo('activated')
    publishControllerChange = () => undefined
    reload = vi.fn<() => void>()
  })

  const createController = () =>
    createApplicationUpdateController(
      (options) => {
        callbacks = options
        return updateServiceWorker
      },
      {
        getController: () => controllerWorker,
        listenForControllerChange: (listener) => {
          publishControllerChange = listener
        },
        loadingDelayMs: 1200,
        reload,
        schedule: (callback, delayMs) => {
          window.setTimeout(callback, delayMs)
        },
      },
    )

  it('does not report first installation as an outdated copy', () => {
    controllerWorker = null
    const worker = new FakeInstallingWorker()
    const registration = new FakeUpdateRegistration(worker)
    const controller = createController()

    controller.start()
    callbacks.onRegisteredSW?.('/games/sw.js', registration)
    worker.moveTo('installed')

    expect(controller.getStatus()).toBe('current')
  })

  it('reports an update as soon as a controlled page finds a worker', () => {
    const registration = new FakeUpdateRegistration(null)
    const controller = createController()
    controller.start()
    callbacks.onRegisteredSW?.('/games/sw.js', registration)

    registration.findUpdate(new FakeInstallingWorker())

    expect(controller.getStatus()).toBe('downloading')
  })

  it('shows loading for a readable interval before activating', async () => {
    const controller = createController()
    controller.start()

    callbacks.onNeedRefresh?.()

    expect(controller.getStatus()).toBe('loading')
    expect(updateServiceWorker).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1199)
    expect(updateServiceWorker).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(updateServiceWorker).toHaveBeenCalledOnce()
  })

  it('surfaces redundant workers and rejected activation without reloading', async () => {
    const worker = new FakeInstallingWorker()
    const controller = createController()
    controller.start()
    callbacks.onRegisteredSW?.(
      '/games/sw.js',
      new FakeUpdateRegistration(worker),
    )

    worker.moveTo('redundant')
    expect(controller.getStatus()).toBe('failed')
    expect(reload).not.toHaveBeenCalled()

    const secondController = createController()
    updateServiceWorker.mockRejectedValueOnce(new Error('activation failed'))
    secondController.start()
    callbacks.onNeedRefresh?.()
    await vi.advanceTimersByTimeAsync(1200)

    expect(secondController.getStatus()).toBe('failed')
    expect(reload).not.toHaveBeenCalled()
  })

  it('ignores registration errors until an actual replacement is detected', () => {
    const controller = createController()
    controller.start()

    callbacks.onRegisterError?.(new Error('offline'))
    expect(controller.getStatus()).toBe('current')

    callbacks.onNeedRefresh?.()
    callbacks.onRegisterError?.(new Error('update failed'))
    expect(controller.getStatus()).toBe('failed')
  })

  it('reloads exactly once when the replacement takes control', async () => {
    const controller = createController()
    controller.start()
    callbacks.onNeedRefresh?.()

    controllerWorker = new FakeInstallingWorker()
    controllerWorker.moveTo('activated')
    callbacks.onNeedReload?.()
    publishControllerChange()
    callbacks.onNeedReload?.()
    await vi.advanceTimersByTimeAsync(0)

    expect(reload).toHaveBeenCalledOnce()
  })
})
