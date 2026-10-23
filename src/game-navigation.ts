export const GAME_QUERY_PARAMETER = 'game'

export const GAME_IDS = ['block-drop', 'brick-burst'] as const
export type GameId = (typeof GAME_IDS)[number]
export function isGameId(value: unknown): value is GameId {
  return typeof value === 'string' && GAME_IDS.some((id) => id === value)
}
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
  if (isGameId(game)) {
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
