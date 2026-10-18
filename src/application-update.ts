export type ApplicationUpdateStatus =
  | 'current'
  | 'downloading'
  | 'loading'
  | 'failed'

export interface InstallingWorker {
  readonly state: ServiceWorkerState
  addEventListener(type: 'statechange', listener: () => void): void
}

interface ControllingWorker extends InstallingWorker {
  removeEventListener(type: 'statechange', listener: () => void): void
}

export interface UpdateRegistration {
  readonly installing: InstallingWorker | null
  addEventListener(type: 'updatefound', listener: () => void): void
  update?(): Promise<unknown>
}

export interface RegisterServiceWorkerOptions {
  immediate?: boolean
  onNeedReload?: () => void
  onNeedRefresh?: () => void
  onRegisteredSW?: (
    serviceWorkerUrl: string,
    registration: UpdateRegistration | undefined,
  ) => void
  onRegisterError?: (error: unknown) => void
}

export type RegisterServiceWorker = (
  options: RegisterServiceWorkerOptions,
) => () => Promise<void>

export interface ApplicationUpdateController {
  getStatus(): ApplicationUpdateStatus
  start(): void
  subscribe(listener: (status: ApplicationUpdateStatus) => void): () => void
}

interface ApplicationUpdateDependencies {
  readonly getController: () => ControllingWorker | null
  readonly listenForControllerChange: (listener: () => void) => void
  readonly listenForAppResume: (listener: () => void) => void
  readonly loadingDelayMs: number
  readonly reload: () => void
  readonly schedule: (callback: () => void, delayMs: number) => void
}

const minimumUpdateCheckIntervalMs = 60_000

const defaultDependencies: ApplicationUpdateDependencies = {
  getController: () =>
    'serviceWorker' in navigator ? navigator.serviceWorker.controller : null,
  listenForControllerChange: (listener) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', listener)
    }
  },
  listenForAppResume: (listener) => {
    const checkWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        listener()
      }
    }

    document.addEventListener('visibilitychange', checkWhenVisible)
    window.addEventListener('pageshow', checkWhenVisible)
    window.addEventListener('focus', checkWhenVisible)
  },
  loadingDelayMs: 1200,
  reload: () => window.location.reload(),
  schedule: (callback, delayMs) => {
    window.setTimeout(callback, delayMs)
  },
}

export function createApplicationUpdateController(
  registerServiceWorker: RegisterServiceWorker,
  dependencies: Partial<ApplicationUpdateDependencies> = {},
): ApplicationUpdateController {
  const {
    getController,
    listenForControllerChange,
    listenForAppResume,
    loadingDelayMs,
    reload,
    schedule,
  } = { ...defaultDependencies, ...dependencies }
  const listeners = new Set<(status: ApplicationUpdateStatus) => void>()
  const observedWorkers = new WeakSet<InstallingWorker>()
  let status: ApplicationUpdateStatus = 'current'
  let started = false
  let updateDetected = false
  let reloadStarted = false
  let updateCheckInProgress = false
  let lastUpdateCheckAt = 0
  let updateServiceWorker: (() => Promise<void>) | undefined
  let updateRegistration: UpdateRegistration | undefined
  let controllerAtStart: ControllingWorker | null = null

  const setStatus = (nextStatus: ApplicationUpdateStatus) => {
    if (status === nextStatus) {
      return
    }

    status = nextStatus
    listeners.forEach((listener) => listener(status))
  }

  const failUpdate = () => {
    if (updateDetected) {
      setStatus('failed')
    }
  }

  const observeInstallingWorker = (worker: InstallingWorker | null) => {
    if (!worker || observedWorkers.has(worker) || !getController()) {
      return
    }

    observedWorkers.add(worker)
    updateDetected = true
    setStatus('downloading')

    const handleStateChange = () => {
      if (worker.state === 'redundant') {
        failUpdate()
      }
    }

    worker.addEventListener('statechange', handleStateChange)
    handleStateChange()
  }

  const start = () => {
    if (started) {
      return
    }
    started = true
    controllerAtStart = getController()

    const reloadLatestCopy = () => {
      if (!updateDetected || reloadStarted) {
        return
      }

      const controller = getController()
      if (!controller || controller === controllerAtStart) {
        schedule(reloadLatestCopy, 25)
        return
      }

      reloadStarted = true
      if (controller.state === 'activated') {
        schedule(reload, 0)
        return
      }

      const handleStateChange = () => {
        if (controller.state !== 'activated') {
          return
        }

        controller.removeEventListener('statechange', handleStateChange)
        schedule(reload, 0)
      }
      controller.addEventListener('statechange', handleStateChange)
    }

    const checkForUpdate = () => {
      const now = Date.now()
      if (
        !updateRegistration?.update ||
        updateCheckInProgress ||
        status === 'downloading' ||
        status === 'loading' ||
        now - lastUpdateCheckAt < minimumUpdateCheckIntervalMs
      ) {
        return
      }

      lastUpdateCheckAt = now
      updateCheckInProgress = true
      void updateRegistration
        .update()
        .catch(() => {
          if (updateDetected) {
            failUpdate()
          }
        })
        .finally(() => {
          updateCheckInProgress = false
        })
    }

    listenForControllerChange(reloadLatestCopy)
    listenForAppResume(checkForUpdate)
    updateServiceWorker = registerServiceWorker({
      immediate: true,
      onRegisteredSW: (_serviceWorkerUrl, registration) => {
        if (!registration) {
          return
        }

        updateRegistration = registration
        observeInstallingWorker(registration.installing)
        registration.addEventListener('updatefound', () => {
          observeInstallingWorker(registration.installing)
        })
        checkForUpdate()
      },
      onNeedRefresh: () => {
        if (!getController()) {
          return
        }

        updateDetected = true
        setStatus('loading')
        schedule(() => {
          if (status !== 'loading') {
            return
          }

          void updateServiceWorker?.().catch(failUpdate)
        }, loadingDelayMs)
      },
      onNeedReload: reloadLatestCopy,
      onRegisterError: failUpdate,
    })
  }

  return {
    getStatus: () => status,
    start,
    subscribe: (listener) => {
      listeners.add(listener)
      listener(status)
      return () => listeners.delete(listener)
    },
  }
}
