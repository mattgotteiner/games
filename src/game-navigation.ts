export const GAME_QUERY_PARAMETER = 'game'

export type GameId = 'block-drop'
export type AppView = 'catalog' | GameId

export interface ParsedGameUrl {
  readonly view: AppView
  readonly hasInvalidGame: boolean
}

export function parseGameUrl(url: URL): ParsedGameUrl {
  if (!url.searchParams.has(GAME_QUERY_PARAMETER)) {
    return { view: 'catalog', hasInvalidGame: false }
  }

  const game = url.searchParams.get(GAME_QUERY_PARAMETER)
  if (game === 'block-drop') {
    return { view: game, hasInvalidGame: false }
  }

  return { view: 'catalog', hasInvalidGame: true }
}

export function urlForView(url: URL, view: AppView): URL {
  const next = new URL(url)
  if (view === 'catalog') {
    next.searchParams.delete(GAME_QUERY_PARAMETER)
  } else {
    next.searchParams.set(GAME_QUERY_PARAMETER, view)
  }
  return next
}
