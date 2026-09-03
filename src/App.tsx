import './app.css'
import { useEffect, useState } from 'preact/hooks'
import {
  type ApplicationUpdateController,
  type ApplicationUpdateStatus,
} from './application-update'
import { ApplicationUpdateNotice } from './ApplicationUpdateNotice'
import {
  parseGameUrl,
  urlForView,
  type AppView,
} from './game-navigation'
import {
  BlockDrop,
  type BlockDropControllerFactory,
} from './games/block-drop/BlockDrop'

function currentUrl(): URL {
  return new URL(window.location.href)
}

function useApplicationUpdateStatus(
  controller: ApplicationUpdateController | undefined,
): ApplicationUpdateStatus {
  const [status, setStatus] = useState<ApplicationUpdateStatus>(
    () => controller?.getStatus() ?? 'current',
  )

  useEffect(() => {
    if (!controller) {
      return
    }

    const unsubscribe = controller.subscribe(setStatus)
    controller.start()
    return unsubscribe
  }, [controller])

  return status
}

export function App({
  applicationUpdateController,
  blockDropControllerFactory,
}: {
  readonly applicationUpdateController?: ApplicationUpdateController
  readonly blockDropControllerFactory?: BlockDropControllerFactory
}) {
  const [view, setView] = useState<AppView>(
    () => parseGameUrl(currentUrl()).view,
  )
  const updateStatus = useApplicationUpdateStatus(applicationUpdateController)

  useEffect(() => {
    const syncFromUrl = () => {
      const parsed = parseGameUrl(currentUrl())
      if (parsed.hasInvalidGame) {
        window.history.replaceState(null, '', urlForView(currentUrl(), 'catalog'))
      }
      setView(parsed.view)
    }

    syncFromUrl()
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  const navigate = (nextView: AppView) => {
    window.history.pushState(null, '', urlForView(currentUrl(), nextView))
    setView(nextView)
  }

  const content =
    view === 'block-drop' ? (
      <BlockDrop
        onReturn={() => navigate('catalog')}
        controllerFactory={blockDropControllerFactory}
      />
    ) : (
      <>
        <header class="app-header">
          <p class="app-kicker">Pick up and play</p>
          <h1>Games</h1>
          <p class="app-intro">
            A growing collection of games made for quick breaks and small
            screens.
          </p>
        </header>

        <main>
          <section class="catalog" aria-labelledby="catalog-heading">
            <div class="catalog-heading">
              <h2 id="catalog-heading">Game catalog</h2>
              <span class="game-count">1 game</span>
            </div>

            <ul class="game-list">
              <li class="game-card">
                <div>
                  <p class="game-card-kicker">Puzzle</p>
                  <h3>Block Drop</h3>
                  <p>
                    Shape a clear path through a bright stack of falling blocks.
                  </p>
                </div>
                <button
                  class="button-primary play-button"
                  type="button"
                  onClick={() => navigate('block-drop')}
                >
                  Play Block Drop
                </button>
              </li>
            </ul>
          </section>
        </main>
      </>
    )

  return (
    <div
      class={`app-shell${view === 'block-drop' ? ' game-shell' : ''}`}
      data-application-build={import.meta.env.VITE_APPLICATION_BUILD || undefined}
    >
      <ApplicationUpdateNotice status={updateStatus} />
      {content}
    </div>
  )
}
