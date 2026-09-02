import { describe, expect, it } from 'vitest'
import {
  parseGameUrl,
  urlForView,
  type AppView,
} from './game-navigation'

describe('parseGameUrl', () => {
  it.each([
    ['https://example.test/games/', 'catalog', false],
    ['https://example.test/games/?game=block-drop', 'block-drop', false],
    ['https://example.test/games/?game=', 'catalog', true],
    ['https://example.test/games/?game=unknown', 'catalog', true],
  ] as const)(
    'parses %s as %s',
    (input, view: AppView, hasInvalidGame: boolean) => {
      expect(parseGameUrl(new URL(input))).toEqual({ view, hasInvalidGame })
    },
  )
})

describe('urlForView', () => {
  it('selects a game without changing repository path, other parameters, or fragment', () => {
    const result = urlForView(
      new URL('https://example.test/games/?theme=dark#controls'),
      'block-drop',
    )

    expect(result.href).toBe(
      'https://example.test/games/?theme=dark&game=block-drop#controls',
    )
  })

  it('removes only the game parameter for the catalog', () => {
    const result = urlForView(
      new URL(
        'https://example.test/games/?theme=dark&game=unknown&mode=compact#catalog',
      ),
      'catalog',
    )

    expect(result.href).toBe(
      'https://example.test/games/?theme=dark&mode=compact#catalog',
    )
  })
})
