import './app.css'

type Game = Readonly<{
  id: string
  title: string
}>

const games: readonly Game[] = []

export function App() {
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
              {games.length} {games.length === 1 ? 'game' : 'games'}
            </span>
          </div>

          {games.length === 0 ? (
            <div class="empty-state">
              <p class="empty-state-title">No games yet</p>
              <p>New games will appear here when they are ready to play.</p>
            </div>
          ) : (
            <ul class="game-list">
              {games.map((game) => (
                <li key={game.id}>{game.title}</li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
