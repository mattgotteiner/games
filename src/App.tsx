import './app.css'
import { useState } from 'preact/hooks'
import {
  BlockDrop,
  type BlockDropControllerFactory,
} from './games/block-drop/BlockDrop'

export function App({
  blockDropControllerFactory,
}: {
  readonly blockDropControllerFactory?: BlockDropControllerFactory
}) {
  const [view, setView] = useState<'catalog' | 'block-drop'>('catalog')

  if (view === 'block-drop') {
    return (
      <div class="app-shell game-shell">
        <BlockDrop
          onReturn={() => setView('catalog')}
          controllerFactory={blockDropControllerFactory}
        />
      </div>
    )
  }

  return (
    <div class="app-shell">
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
            <span class="game-count">
              1 game
            </span>
          </div>

          <ul class="game-list">
            <li class="game-card">
              <div>
                <p class="game-card-kicker">Puzzle</p>
                <h3>Block Drop</h3>
                <p>Shape a clear path through a bright stack of falling blocks.</p>
              </div>
              <button type="button" onClick={() => setView('block-drop')}>
                Play Block Drop
              </button>
            </li>
          </ul>
        </section>
      </main>
    </div>
  )
}
