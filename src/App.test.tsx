import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import type {
  ApplicationUpdateController,
  ApplicationUpdateStatus,
} from './application-update'
import {
  BlockDrop,
  type BlockDropControllerFactory,
} from './games/block-drop/BlockDrop'
import type { BlockDropStateListener } from './games/block-drop/controller'
import {
  createGame,
  TETROMINOES,
  type BlockDropDifficulty,
  type GameAction,
  type Tetromino,
} from './games/block-drop/rules'
import { IMPLEMENTED_BLOCK_DROP_THEME_ORDER } from './games/block-drop/theme-renderers'

function dispatchPointer(
  target: HTMLElement,
  type: string,
  pointerId = 1,
  init: { readonly isPrimary?: boolean; readonly button?: number } = {},
) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    isPrimary: { value: init.isPrimary ?? true },
    button: { value: init.button ?? 0 },
  })
  fireEvent(target, event)
}

function expectHudDifficulty(label: string, multiplier: string) {
  expect(
    document.querySelector('.difficulty-value > span:first-child'),
  ).toHaveTextContent(label)
  expect(document.querySelector('.difficulty-multiplier')).toHaveTextContent(
    multiplier,
  )
}

const pendingRestorations: Array<() => void> = []

function mockVibration(supported: boolean, reducedMotion: boolean) {
  const previousVibrate = Object.getOwnPropertyDescriptor(navigator, 'vibrate')
  const previousMatchMedia = Object.getOwnPropertyDescriptor(
    window,
    'matchMedia',
  )
  const vibrate = vi.fn()

  if (supported) {
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: vibrate,
    })
  } else {
    Reflect.deleteProperty(navigator, 'vibrate')
  }
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({ matches: reducedMotion }) as MediaQueryList),
  })

  let restored = false
  const restore = () => {
    if (restored) return
    restored = true
    if (previousVibrate) {
      Object.defineProperty(navigator, 'vibrate', previousVibrate)
    } else {
      Reflect.deleteProperty(navigator, 'vibrate')
    }
    if (previousMatchMedia) {
      Object.defineProperty(window, 'matchMedia', previousMatchMedia)
    } else {
      Reflect.deleteProperty(window, 'matchMedia')
    }
  }
  pendingRestorations.push(restore)

  return {
    vibrate,
    restore,
  }
}

function setVisibilityState(value: DocumentVisibilityState) {
  const previous = Object.getOwnPropertyDescriptor(document, 'visibilityState')
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value,
  })
  pendingRestorations.push(() => {
    if (previous) {
      Object.defineProperty(document, 'visibilityState', previous)
    } else {
      Reflect.deleteProperty(document, 'visibilityState')
    }
  })
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  for (const restore of pendingRestorations.splice(0).reverse()) restore()
})

function updateController(
  status: ApplicationUpdateStatus,
): ApplicationUpdateController {
  return {
    getStatus: () => status,
    start: vi.fn(),
    subscribe: (listener) => {
      listener(status)
      return vi.fn()
    },
  }
}

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/games/')
    window.localStorage.clear()
  })

  it('launches Block Drop and cleans up when history changes', () => {
    const dispatch = vi.fn()
    const destroy = vi.fn()
    const factory: BlockDropControllerFactory = vi.fn(() => ({
      dispatch,
      destroy,
      getState: () => createGame(5),
    }))
    const { container } = render(<App blockDropControllerFactory={factory} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Games' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Game catalog' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Play Block Drop' }))

    expect(window.location.pathname).toBe('/games/')
    expect(window.location.search).toBe('?game=block-drop')
    expect(screen.getByRole('heading', { name: 'Block Drop' })).toBeInTheDocument()
    expect(screen.getByText('Playing')).toBeInTheDocument()
    const sessionActions = screen.getByRole('group', {
      name: 'Session actions',
    })
    expect(within(sessionActions).getByRole('button', { name: 'Pause game' }))
      .toBeInTheDocument()
    expect(
      within(sessionActions).queryByRole('button', { name: 'Help' }),
    ).not.toBeInTheDocument()
    expect(
      within(sessionActions).queryByRole('button', { name: 'Restart game' }),
    ).not.toBeInTheDocument()
    expect(container.querySelectorAll('.action-controls button')).toHaveLength(2)
    expect(container.querySelectorAll('.hold-controls button')).toHaveLength(1)
    expect(
      Array.from(
        container.querySelectorAll<HTMLButtonElement>('.game-controls button'),
        (button) => button.getAttribute('aria-label'),
      ),
    ).toEqual([
      'Move left',
      'Move right',
      'Soft drop',
      'Hold piece',
      'Rotate clockwise',
      'Hard drop',
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Move left' }))
    fireEvent.click(screen.getByRole('button', { name: 'Move right' }))
    fireEvent.click(screen.getByRole('button', { name: 'Soft drop' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hold piece' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rotate clockwise' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hard drop' }))
    expect(dispatch).toHaveBeenNthCalledWith(1, 'left')
    expect(dispatch).toHaveBeenNthCalledWith(2, 'right')
    expect(dispatch).toHaveBeenNthCalledWith(3, 'soft-drop')
    expect(dispatch).toHaveBeenNthCalledWith(4, 'hold')
    expect(dispatch).toHaveBeenNthCalledWith(5, 'rotate')
    expect(dispatch).toHaveBeenNthCalledWith(6, 'hard-drop')
    expect(screen.getByRole('region', { name: 'Held piece: empty' }))
      .toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hold piece' }))
      .toHaveAttribute('aria-keyshortcuts', 'C')

    expect(
      screen.queryByRole('button', { name: /catalog/i }),
    ).not.toBeInTheDocument()
    window.history.replaceState(null, '', '/games/')
    fireEvent(window, new PopStateEvent('popstate'))
    expect(destroy).toHaveBeenCalledOnce()
    expect(window.location.search).toBe('')
    expect(
      screen.getByRole('button', { name: 'Play Block Drop' }),
    ).toBeInTheDocument()
  })

  it('acts on pointer press and repeats only after the configured delay', () => {
    vi.useFakeTimers()
    const dispatch = vi.fn()
    const factory: BlockDropControllerFactory = () => ({
      dispatch,
      destroy: vi.fn(),
      getState: () => createGame(5),
    })
    render(<BlockDrop controllerFactory={factory} />)
    const left = screen.getByRole('button', { name: 'Move left' })

    dispatchPointer(left, 'pointerdown')
    expect(dispatch).toHaveBeenNthCalledWith(1, 'left')
    act(() => {
      vi.advanceTimersByTime(169)
    })
    expect(dispatch).toHaveBeenCalledOnce()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(dispatch).toHaveBeenNthCalledWith(2, 'left')
    act(() => {
      vi.advanceTimersByTime(49)
    })
    expect(dispatch).toHaveBeenCalledTimes(2)
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(dispatch).toHaveBeenNthCalledWith(3, 'left')

    dispatchPointer(left, 'pointerup')
    fireEvent.click(left, { detail: 1 })
    act(() => {
      vi.advanceTimersByTime(250)
    })
    expect(dispatch).toHaveBeenCalledTimes(3)
    fireEvent.keyDown(left, { key: 'Enter' })
    fireEvent.click(left, { detail: 0 })
    expect(dispatch).toHaveBeenNthCalledWith(4, 'left')
  })

  it.each(['pointerup', 'pointercancel', 'lostpointercapture'] as const)(
    'stops hold repeat on %s',
    (eventType) => {
      vi.useFakeTimers()
      const dispatch = vi.fn()
      const factory: BlockDropControllerFactory = () => ({
        dispatch,
        destroy: vi.fn(),
        getState: () => createGame(5),
      })
      render(<BlockDrop controllerFactory={factory} />)
      const right = screen.getByRole('button', { name: 'Move right' })

      dispatchPointer(right, 'pointerdown')
      act(() => {
        vi.advanceTimersByTime(220)
      })
      expect(dispatch).toHaveBeenCalledTimes(3)
      dispatchPointer(right, eventType)
      act(() => {
        vi.advanceTimersByTime(250)
      })
      expect(dispatch).toHaveBeenCalledTimes(3)
    },
  )

  it.each([
    ['paused', 'paused', { clearing: false }],
    ['line clearing', 'playing', { clearing: true }],
    ['game over', 'game-over', { clearing: false }],
  ] as const)(
    'stops hold repeat when the game enters %s',
    (_name, status, presentation) => {
      vi.useFakeTimers()
      const initial = createGame(5)
      let publish: BlockDropStateListener | undefined
      const dispatch = vi.fn()
      const factory: BlockDropControllerFactory = (
        _canvas,
        _container,
        onStateChange,
      ) => {
        publish = onStateChange
        return { dispatch, destroy: vi.fn(), getState: () => initial }
      }
      render(<BlockDrop controllerFactory={factory} />)
      const left = screen.getByRole('button', { name: 'Move left' })

      dispatchPointer(left, 'pointerdown')
      act(() => publish?.({ ...initial, status }, presentation))
      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(dispatch).toHaveBeenCalledOnce()
      expect(left).toBeDisabled()
    },
  )

  it('cleans hold timers on unmount and keeps simultaneous controls independent', () => {
    vi.useFakeTimers()
    const dispatch = vi.fn()
    const factory: BlockDropControllerFactory = () => ({
      dispatch,
      destroy: vi.fn(),
      getState: () => createGame(5),
    })
    const { unmount } = render(
      <BlockDrop controllerFactory={factory} />,
    )
    const left = screen.getByRole('button', { name: 'Move left' })
    const rotate = screen.getByRole('button', { name: 'Rotate clockwise' })
    const hold = screen.getByRole('button', { name: 'Hold piece' })
    const drop = screen.getByRole('button', { name: 'Hard drop' })

    dispatchPointer(left, 'pointerdown', 1)
    dispatchPointer(rotate, 'pointerdown', 2)
    dispatchPointer(drop, 'pointerdown', 3)
    dispatchPointer(hold, 'pointerdown', 4)
    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      'left',
      'rotate',
      'hard-drop',
      'hold',
    ])
    act(() => {
      vi.advanceTimersByTime(170)
    })
    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      'left',
      'rotate',
      'hard-drop',
      'hold',
      'left',
    ])
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(dispatch.mock.calls.filter(([action]) => action === 'rotate'))
      .toHaveLength(1)
    expect(dispatch.mock.calls.filter(([action]) => action === 'hard-drop'))
      .toHaveLength(1)
    expect(dispatch.mock.calls.filter(([action]) => action === 'hold'))
      .toHaveLength(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
    expect(dispatch.mock.calls.filter(([action]) => action === 'left'))
      .toHaveLength(12)
  })

  it('dispatches Enter, Space, and programmatic control activation once', () => {
    const dispatch = vi.fn()
    const factory: BlockDropControllerFactory = () => ({
      dispatch,
      destroy: vi.fn(),
      getState: () => createGame(5),
    })
    render(<BlockDrop controllerFactory={factory} />)
    const left = screen.getByRole('button', { name: 'Move left' })
    const rotate = screen.getByRole('button', { name: 'Rotate clockwise' })
    const drop = screen.getByRole('button', { name: 'Hard drop' })

    fireEvent.keyDown(left, { key: 'Enter' })
    fireEvent.click(left, { detail: 0 })
    fireEvent.keyDown(rotate, { key: ' ' })
    fireEvent.click(rotate, { detail: 0 })
    fireEvent.click(drop)

    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      'left',
      'rotate',
      'hard-drop',
    ])
  })

  it('vibrates for locks and line clears when supported and motion is allowed', () => {
    const mock = mockVibration(true, false)
    let publish: BlockDropStateListener | undefined
    const initial = createGame(5)
    const factory: BlockDropControllerFactory = (
      _canvas,
      _container,
      onStateChange,
    ) => {
      publish = onStateChange
      return {
        dispatch: vi.fn(),
        destroy: vi.fn(),
        getState: () => initial,
      }
    }

    render(<BlockDrop controllerFactory={factory} />)
    act(() => publish?.(initial, { clearing: false, locked: true }))
    act(() =>
      publish?.(initial, { clearing: true, clearedLines: 1, locked: true }),
    )

    expect(mock.vibrate).toHaveBeenNthCalledWith(1, 10)
    expect(mock.vibrate).toHaveBeenNthCalledWith(2, 20)
    mock.restore()
  })

  it.each([
    ['unsupported', false, false],
    ['reduced motion', true, true],
  ] as const)(
    'skips haptics when vibration is %s',
    (_name, supported, reducedMotion) => {
      const mock = mockVibration(supported, reducedMotion)
      let publish: BlockDropStateListener | undefined
      const initial = createGame(5)
      const factory: BlockDropControllerFactory = (
        _canvas,
        _container,
        onStateChange,
      ) => {
        publish = onStateChange
        return {
          dispatch: vi.fn(),
          destroy: vi.fn(),
          getState: () => initial,
        }
      }

      render(<BlockDrop controllerFactory={factory} />)
      act(() => publish?.(initial, { clearing: false, locked: true }))
      expect(mock.vibrate).not.toHaveBeenCalled()
      mock.restore()
    },
  )

  it('opens a valid deep link directly', () => {
    window.history.replaceState(null, '', '/games/?theme=dark&game=block-drop#play')
    render(<App blockDropControllerFactory={() => ({
      dispatch: vi.fn(),
      destroy: vi.fn(),
      getState: () => createGame(5),
    })} />)

    expect(screen.getByRole('heading', { name: 'Block Drop' })).toBeInTheDocument()
    expect(window.location.href).toContain('/games/?theme=dark&game=block-drop#play')
  })

  it('keeps update status visible in the catalog and an active game', () => {
    render(
      <App
        applicationUpdateController={updateController('downloading')}
        blockDropControllerFactory={() => ({
          dispatch: vi.fn(),
          destroy: vi.fn(),
          getState: () => createGame(5),
        })}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'This copy is out of date',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Play Block Drop' }))

    expect(screen.getByRole('heading', { name: 'Block Drop' })).toBeInTheDocument()
    expect(
      screen.getByText(/Downloading the latest version of Games/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move left' })).toBeEnabled()
  })

  it('canonicalizes invalid game links without losing unrelated URL data', () => {
    window.history.replaceState(
      null,
      '',
      '/games/?theme=dark&game=unknown&mode=compact#catalog',
    )
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Games' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/games/')
    expect(window.location.search).toBe('?theme=dark&mode=compact')
    expect(window.location.hash).toBe('#catalog')
  })

  it('follows history URLs and destroys game resources on catalog navigation', () => {
    const destroy = vi.fn()
    const factory: BlockDropControllerFactory = () => ({
      dispatch: vi.fn(),
      destroy,
      getState: () => createGame(5),
    })
    render(<App blockDropControllerFactory={factory} />)
    fireEvent.click(screen.getByRole('button', { name: 'Play Block Drop' }))

    window.history.replaceState(null, '', '/games/')
    fireEvent.popState(window)
    expect(destroy).toHaveBeenCalledOnce()
    expect(screen.getByRole('heading', { name: 'Games' })).toBeInTheDocument()

    window.history.replaceState(null, '', '/games/?game=block-drop')
    fireEvent.popState(window)
    expect(screen.getByRole('heading', { name: 'Block Drop' })).toBeInTheDocument()
  })

  it('removes its history listener when unmounted', () => {
    const removeEventListener = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<App />)

    unmount()

    expect(removeEventListener).toHaveBeenCalledWith(
      'popstate',
      expect.any(Function),
    )
    removeEventListener.mockRestore()
  })

  it('shows a focused game-over card with final and best scores', () => {
    const dispatch = vi.fn()
    const gameOver = {
      ...createGame(5),
      active: null,
      status: 'game-over' as const,
      score: 42,
    }
    const factory: BlockDropControllerFactory = (
      _canvas,
      _container,
      _onStateChange,
    ) => ({
      dispatch,
      destroy: vi.fn(),
      getState: () => gameOver,
    })

    render(<BlockDrop controllerFactory={factory} />)
    const card = screen.getByRole('group', { name: 'Game over' })
    expect(within(card).getByText('Final score')).toBeInTheDocument()
    expect(within(card).getByText('Best score')).toBeInTheDocument()
    expect(card.querySelectorAll('.game-over-scores dd')).toHaveLength(2)
    expect(card.querySelectorAll('.game-over-scores dd')[0]).toHaveTextContent(
      '42',
    )
    expect(within(card).getByText('New best')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play again' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Move left' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Hard drop' })).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: 'Restart game' }),
    ).not.toBeInTheDocument()
    fireEvent.click(within(card).getByRole('button', { name: 'Play again' }))
    expect(dispatch).toHaveBeenCalledWith('restart')
  })

  it('focuses pause actions and returns focus to the board after resume or restart', () => {
    let publish: BlockDropStateListener | undefined
    const initial = createGame(5)
    const dispatch = vi.fn()
    const factory: BlockDropControllerFactory = (
      _canvas,
      _container,
      onStateChange,
    ) => {
      publish = onStateChange
      return {
        dispatch,
        destroy: vi.fn(),
        getState: () => initial,
      }
    }

    render(<BlockDrop controllerFactory={factory} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pause game' }))
    expect(dispatch).toHaveBeenCalledWith('pause')

    act(() => publish?.({ ...initial, status: 'paused' }))
    expect(screen.getByRole('group', { name: 'Paused' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move left' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Hard drop' })).toBeDisabled()
    const pausePanel = screen.getByRole('group', { name: 'Paused' })
    expect(
      within(pausePanel).getByRole('button', { name: 'Resume game' }),
    ).toHaveFocus()
    expect(
      within(pausePanel).getByRole('button', { name: 'Restart game' }),
    ).toBeEnabled()
    expect(
      within(pausePanel).getByRole('button', { name: 'Help' }),
    ).toBeEnabled()
    expect(
      within(screen.getByRole('group', { name: 'Session actions' })).queryByRole(
        'button',
        { name: 'Restart game' },
      ),
    ).not.toBeInTheDocument()
    expect(
      within(screen.getByRole('group', { name: 'Session actions' })).queryByRole(
        'button',
        { name: 'Help' },
      ),
    ).not.toBeInTheDocument()

    fireEvent.click(
      within(pausePanel).getByRole('button', { name: 'Resume game' }),
    )
    act(() => publish?.(initial))
    expect(
      screen.getByRole('region', { name: 'Block Drop playfield' }),
    ).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Pause game' }))
    act(() => publish?.({ ...initial, status: 'paused' }))
    const restartedPanel = screen.getByRole('group', { name: 'Paused' })
    fireEvent.click(
      within(restartedPanel).getByRole('button', { name: 'Restart game' }),
    )
    act(() => publish?.(initial))
    expect(
      screen.getByRole('region', { name: 'Block Drop playfield' }),
    ).toHaveFocus()
    expect(dispatch).toHaveBeenNthCalledWith(2, 'pause')
    expect(dispatch).toHaveBeenNthCalledWith(4, 'restart')
  })

  it('applies the selected pause difficulty and displays half-point score values', () => {
    let state = createGame(5)
    let publish: BlockDropStateListener | undefined
    const setDifficulty = vi.fn((difficulty: BlockDropDifficulty) => {
      state = { ...state, difficulty }
      publish?.(state)
    })
    const factory: BlockDropControllerFactory = (
      _canvas,
      _container,
      onStateChange,
    ) => {
      publish = onStateChange
      return {
        dispatch: vi.fn(),
        destroy: vi.fn(),
        getState: () => state,
        setDifficulty,
      }
    }

    render(<BlockDrop controllerFactory={factory} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pause game' }))
    act(() => {
      state = { ...state, status: 'paused' }
      publish?.(state)
    })

    const slider = screen.getByRole('slider', { name: 'Difficulty' })
    fireEvent.input(slider, { target: { value: '0' } })
    expect(setDifficulty).toHaveBeenCalledWith('easy')
    expect(slider).toHaveAttribute('aria-valuetext', 'Easy, half speed')
    expect(
      document.querySelector('.pause-difficulty output'),
    ).toHaveTextContent('Easy · Half speed')
    expect(window.localStorage.getItem('games.block-drop.difficulty')).toBe(
      'easy',
    )

    act(() => publish?.({ ...state, score: 0.5 }))
    expect(screen.getByLabelText('Score: 0.5')).toBeInTheDocument()
  })

  it('restores a saved difficulty in the initial game and HUD', () => {
    window.localStorage.setItem('games.block-drop.difficulty', 'hard')
    let initialDifficulty: BlockDropDifficulty | undefined
    const factory: BlockDropControllerFactory = (
      _canvas,
      _container,
      _onStateChange,
      options,
    ) => {
      initialDifficulty = options?.difficulty
      const initial = createGame(5, options?.difficulty)
      return {
        dispatch: vi.fn(),
        destroy: vi.fn(),
        getState: () => initial,
      }
    }

    render(<BlockDrop controllerFactory={factory} />)

    expect(initialDifficulty).toBe('hard')
    expectHudDifficulty('Hard', '1.5×')
    expect(
      screen.getByRole('group', {
        name: 'Level 1, 0 lines cleared, Hard difficulty',
      }),
    ).toBeInTheDocument()
  })

  it.each(['expert', '1.5'])('defaults to Medium for invalid preference %s', (value) => {
    window.localStorage.setItem('games.block-drop.difficulty', value)
    let initialDifficulty: BlockDropDifficulty | undefined
    const factory: BlockDropControllerFactory = (
      _canvas,
      _container,
      _onStateChange,
      options,
    ) => {
      initialDifficulty = options?.difficulty
      const initial = createGame(5, options?.difficulty)
      return {
        dispatch: vi.fn(),
        destroy: vi.fn(),
        getState: () => initial,
      }
    }

    render(<BlockDrop controllerFactory={factory} />)

    expect(initialDifficulty).toBe('medium')
    expectHudDifficulty('Medium', '1×')
  })

  it('restores the saved theme and applies a selection without changing paused game state', () => {
    window.localStorage.setItem('games.block-drop.theme', 'tron')
    let state = createGame(5)
    let publish: BlockDropStateListener | undefined
    let initialTheme: string | undefined
    const setTheme = vi.fn()
    const dispatch = vi.fn((action: GameAction) => {
      if (action !== 'pause') return
      state = { ...state, status: 'paused' }
      publish?.(state)
    })
    const factory: BlockDropControllerFactory = (
      _canvas,
      _container,
      onStateChange,
      options,
    ) => {
      publish = onStateChange
      initialTheme = options?.theme
      return {
        dispatch,
        destroy: vi.fn(),
        getState: () => state,
        setTheme,
      }
    }

    render(<BlockDrop controllerFactory={factory} />)

    expect(initialTheme).toBe('tron')
    expect(document.querySelector('.block-drop')).toHaveAttribute(
      'data-theme',
      'tron',
    )
    expect(document.documentElement).toHaveAttribute(
      'data-block-drop-theme',
      'tron',
    )
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      '#020409',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Pause game' }))
    const pause = screen.getByRole('group', { name: 'Paused' })
    const themeGroup = within(pause).getByRole('group', { name: /^Theme/ })
    const radios = within(themeGroup).getAllByRole('radio')
    expect(radios.map((radio) => (radio as HTMLInputElement).value)).toEqual(
      IMPLEMENTED_BLOCK_DROP_THEME_ORDER,
    )
    expect(within(themeGroup).getByRole('radio', { name: 'Tron' })).toBeChecked()
    expect(themeGroup.querySelector('output')).toHaveTextContent(
      'Selected: Tron',
    )
    expect(themeGroup.querySelector('[data-selected="true"]')).toHaveTextContent(
      'Selected',
    )
    expect(themeGroup.previousElementSibling).toBe(
      pause.querySelector('.overlay-actions'),
    )

    const stateBefore = {
      score: screen.getByLabelText(/^Score:/).textContent,
      progress: document.querySelector('.game-progress')?.textContent,
      status: document.querySelector('.game-status')?.textContent,
    }
    fireEvent.click(
      themeGroup.querySelector('label[data-theme-option="classic"]')!,
    )

    expect(setTheme).toHaveBeenCalledWith('classic')
    expect(window.localStorage.getItem('games.block-drop.theme')).toBe('classic')
    expect(themeGroup.querySelector('output')).toHaveTextContent(
      'Selected: Classic',
    )
    expect(document.querySelector('.block-drop')).toHaveAttribute(
      'data-theme',
      'classic',
    )
    expect(document.documentElement).toHaveAttribute(
      'data-block-drop-theme',
      'classic',
    )
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      '#162033',
    )
    expect({
      score: screen.getByLabelText(/^Score:/).textContent,
      progress: document.querySelector('.game-progress')?.textContent,
      status: document.querySelector('.game-status')?.textContent,
    }).toEqual(stateBefore)
  })

  it.each(['not-a-theme', 'stained-glass'])(
    'falls back to Classic for invalid or unavailable theme %s',
    (value) => {
      window.localStorage.setItem('games.block-drop.theme', value)
      let initialTheme: string | undefined
      const factory: BlockDropControllerFactory = (
        _canvas,
        _container,
        _onStateChange,
        options,
      ) => {
        initialTheme = options?.theme
        return {
          dispatch: vi.fn(),
          destroy: vi.fn(),
          getState: () => createGame(5),
        }
      }

      render(<BlockDrop controllerFactory={factory} />)

      expect(initialTheme).toBe('classic')
      expect(document.querySelector('.block-drop')).toHaveAttribute(
        'data-theme',
        'classic',
      )
      expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
        'content',
        '#162033',
      )
    },
  )

  it('restores previous document theme attributes and browser chrome on unmount', () => {
    const root = document.documentElement
    const previousTheme = root.getAttribute('data-block-drop-theme')
    const previousPage = root.style.getPropertyValue('--bd-page')
    const previousPagePriority = root.style.getPropertyPriority('--bd-page')
    const existingMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    )
    const meta = existingMeta ?? document.createElement('meta')
    const previousMetaContent = meta.getAttribute('content')
    if (existingMeta === null) {
      meta.name = 'theme-color'
      document.head.append(meta)
    }
    root.dataset.blockDropTheme = 'prior-theme'
    root.style.setProperty('--bd-page', '#010203', 'important')
    meta.content = '#aabbcc'
    pendingRestorations.push(() => {
      if (previousTheme === null) root.removeAttribute('data-block-drop-theme')
      else root.setAttribute('data-block-drop-theme', previousTheme)
      if (previousPage === '') root.style.removeProperty('--bd-page')
      else root.style.setProperty('--bd-page', previousPage, previousPagePriority)
      if (existingMeta === null) meta.remove()
      else if (previousMetaContent === null) meta.removeAttribute('content')
      else meta.content = previousMetaContent
    })

    const factory: BlockDropControllerFactory = () => ({
      dispatch: vi.fn(),
      destroy: vi.fn(),
      getState: () => createGame(5),
    })
    const { unmount } = render(<BlockDrop controllerFactory={factory} />)
    expect(root).toHaveAttribute('data-block-drop-theme', 'classic')
    expect(root.style.getPropertyValue('--bd-page')).toBe('#07111f')
    expect(meta.content).toBe('#162033')

    unmount()
    expect(root).toHaveAttribute('data-block-drop-theme', 'prior-theme')
    expect(root.style.getPropertyValue('--bd-page')).toBe('#010203')
    expect(root.style.getPropertyPriority('--bd-page')).toBe('important')
    expect(meta.content).toBe('#aabbcc')
  })

  it('keeps an existing best score when a later run scores less', () => {
    window.localStorage.setItem('games.block-drop.best-score', '250')
    const gameOver = {
      ...createGame(5),
      active: null,
      status: 'game-over' as const,
      score: 42,
    }
    const factory: BlockDropControllerFactory = () => ({
      dispatch: vi.fn(),
      destroy: vi.fn(),
      getState: () => gameOver,
    })

    render(<BlockDrop controllerFactory={factory} />)

    const card = screen.getByRole('group', { name: 'Game over' })
    const scores = card.querySelectorAll('.game-over-scores dd')
    expect(scores[0]).toHaveTextContent('42')
    expect(scores[1]).toHaveTextContent('250')
    expect(within(card).queryByText('New best')).not.toBeInTheDocument()
    expect(window.localStorage.getItem('games.block-drop.best-score')).toBe(
      '250',
    )
  })

  it.each(['', '-1', '1.25', 'not-a-score', '9007199254740992'])(
    'treats malformed stored best score %j as zero',
    (storedScore) => {
      window.localStorage.setItem(
        'games.block-drop.best-score',
        storedScore,
      )
      const gameOver = {
        ...createGame(5),
        active: null,
        status: 'game-over' as const,
      }
      const factory: BlockDropControllerFactory = () => ({
        dispatch: vi.fn(),
        destroy: vi.fn(),
        getState: () => gameOver,
      })

      render(<BlockDrop controllerFactory={factory} />)

      const scores = screen
        .getByRole('group', { name: 'Game over' })
        .querySelectorAll('.game-over-scores dd')
      expect(scores[1]).toHaveTextContent('0')
      expect(window.localStorage.getItem('games.block-drop.best-score')).toBe(
        storedScore,
      )
    },
  )

  it('reads and displays a saved half-point best score', () => {
    window.localStorage.setItem('games.block-drop.best-score', '1.5')
    const gameOver = {
      ...createGame(5),
      active: null,
      status: 'game-over' as const,
    }
    const factory: BlockDropControllerFactory = () => ({
      dispatch: vi.fn(),
      destroy: vi.fn(),
      getState: () => gameOver,
    })

    render(<BlockDrop controllerFactory={factory} />)

    const scores = screen
      .getByRole('group', { name: 'Game over' })
      .querySelectorAll('.game-over-scores dd')
    expect(scores[0]).toHaveTextContent('0')
    expect(scores[1]).toHaveTextContent('1.5')
    expect(window.localStorage.getItem('games.block-drop.best-score')).toBe(
      '1.5',
    )
  })

  it('saves a half-point final score without rounding it', () => {
    const gameOver = {
      ...createGame(5),
      active: null,
      status: 'game-over' as const,
      score: 0.5,
    }
    const factory: BlockDropControllerFactory = () => ({
      dispatch: vi.fn(),
      destroy: vi.fn(),
      getState: () => gameOver,
    })

    render(<BlockDrop controllerFactory={factory} />)

    const scores = screen
      .getByRole('group', { name: 'Game over' })
      .querySelectorAll('.game-over-scores dd')
    expect(scores[0]).toHaveTextContent('0.5')
    expect(scores[1]).toHaveTextContent('0.5')
    expect(window.localStorage.getItem('games.block-drop.best-score')).toBe(
      '0.5',
    )
  })

  it('remains playable when device storage throws during read and write', () => {
    const previousStorage = Object.getOwnPropertyDescriptor(window, 'localStorage')
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new DOMException('Storage unavailable', 'SecurityError')
      },
    })
    pendingRestorations.push(() => {
      if (previousStorage) {
        Object.defineProperty(window, 'localStorage', previousStorage)
      } else Reflect.deleteProperty(window, 'localStorage')
    })

    let publish: BlockDropStateListener | undefined
    const playing = createGame(5)
    let initialTheme: string | undefined
    const setTheme = vi.fn()
    const dispatch = vi.fn((action: GameAction) => {
      if (action !== 'pause') return
      publish?.({ ...playing, status: 'paused' })
    })
    const factory: BlockDropControllerFactory = (
      _canvas,
      _container,
      onStateChange,
      options,
    ) => {
      publish = onStateChange
      initialTheme = options?.theme
      return {
        dispatch,
        destroy: vi.fn(),
        getState: () => playing,
        setTheme,
      }
    }

    render(<BlockDrop controllerFactory={factory} />)
    expect(initialTheme).toBe('classic')
    expect(screen.getByText('Playing')).toBeInTheDocument()
    expectHudDifficulty('Medium', '1×')
    fireEvent.click(screen.getByRole('button', { name: 'Pause game' }))
    const pause = screen.getByRole('group', { name: 'Paused' })
    fireEvent.click(pause.querySelector('label[data-theme-option="tron"]')!)
    expect(setTheme).toHaveBeenCalledWith('tron')
    expect(document.querySelector('.block-drop')).toHaveAttribute(
      'data-theme',
      'tron',
    )
    expect(screen.getByRole('group', { name: 'Paused' })).toBeInTheDocument()

    act(() =>
      publish?.({ ...playing, active: null, status: 'game-over', score: 14 }),
    )

    const card = screen.getByRole('group', { name: 'Game over' })
    expect(card.querySelectorAll('.game-over-scores dd')[1]).toHaveTextContent(
      '14',
    )
    expect(within(card).getByText('New best')).toBeInTheDocument()
  })

  it('pauses once when hidden, remains paused when visible, and removes its listener', () => {
    let state = createGame(5)
    let publish: BlockDropStateListener | undefined
    const dispatch = vi.fn((action: GameAction) => {
      if (action !== 'pause') return
      state = { ...state, status: state.status === 'playing' ? 'paused' : 'playing' }
      publish?.(state)
    })
    const factory: BlockDropControllerFactory = (
      _canvas,
      _container,
      onStateChange,
    ) => {
      publish = onStateChange
      return {
        dispatch,
        destroy: vi.fn(),
        getState: () => state,
      }
    }
    const { unmount } = render(
      <BlockDrop controllerFactory={factory} />,
    )

    setVisibilityState('hidden')
    fireEvent(document, new Event('visibilitychange'))
    expect(dispatch).toHaveBeenCalledOnce()
    expect(dispatch).toHaveBeenCalledWith('pause')
    expect(screen.getByRole('group', { name: 'Paused' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('group', { name: 'Paused' })).getByRole(
        'button',
        { name: 'Resume game' },
      ),
    ).toHaveFocus()

    setVisibilityState('visible')
    fireEvent(document, new Event('visibilitychange'))
    expect(screen.getByRole('group', { name: 'Paused' })).toBeInTheDocument()
    expect(dispatch).toHaveBeenCalledOnce()

    unmount()
    setVisibilityState('hidden')
    fireEvent(document, new Event('visibilitychange'))
    expect(dispatch).toHaveBeenCalledOnce()
  })

  it.each(['paused', 'game-over'] as const)(
    'does not change the %s state when the hidden event fires',
    (status) => {
      const initial = { ...createGame(5), status }
      const dispatch = vi.fn()
      const factory: BlockDropControllerFactory = () => ({
        dispatch,
        destroy: vi.fn(),
        getState: () => initial,
      })
      render(<BlockDrop controllerFactory={factory} />)

      setVisibilityState('hidden')
      fireEvent(document, new Event('visibilitychange'))

      expect(dispatch).not.toHaveBeenCalled()
    },
  )

  it('displays score semantically through play, game over, and restart', () => {
    let publish: BlockDropStateListener | undefined
    const playing = { ...createGame(5), score: 7 }
    const dispatch = vi.fn()
    const factory: BlockDropControllerFactory = (
      _canvas,
      _container,
      onStateChange,
    ) => {
      publish = onStateChange
      return {
        dispatch,
        destroy: vi.fn(),
        getState: () => playing,
      }
    }

    render(<BlockDrop controllerFactory={factory} />)
    expect(screen.getByLabelText('Score: 7')).toBeInTheDocument()
    expect(
      screen.getByRole('complementary', { name: 'Game information' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Level')).toBeInTheDocument()
    expect(screen.getByText('Lines')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Pause game' }))
    expect(dispatch).toHaveBeenCalledOnce()
    expect(dispatch).toHaveBeenCalledWith('pause')
    act(() => publish?.({ ...playing, status: 'paused' }))
    const pausePanel = screen.getByRole('group', { name: 'Paused' })
    expect(
      within(pausePanel).getByRole('button', { name: 'Help' }),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('group', { name: 'Session actions' })).queryByRole(
        'button',
        { name: 'Help' },
      ),
    ).not.toBeInTheDocument()
    fireEvent.click(within(pausePanel).getByRole('button', { name: 'Help' }))
    const dialog = screen.getByRole('dialog', { name: 'Help' })
    const dialogHeadings = within(dialog).getAllByRole('heading')
    expect(dialogHeadings.map((heading) => heading.textContent)).toEqual([
      'Help',
      'How to play',
      'Scoring and controls',
      'Scoring',
      'Keyboard controls',
    ])
    expect(
      within(dialog).getByText(/Each piece has four squares and falls from the top/),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText(/any part of a piece is still above the board when it lands/),
    ).toBeInTheDocument()
    const scoring = within(dialog).getByRole('region', { name: 'Scoring' })
    expect(within(scoring).getByText('Soft drop')).toBeInTheDocument()
    expect(
      within(scoring).getByText('+1 / row × difficulty'),
    ).toBeInTheDocument()
    expect(within(scoring).getByText('Hard drop')).toBeInTheDocument()
    expect(
      within(scoring).getByText('+2 / row × difficulty'),
    ).toBeInTheDocument()
    expect(within(scoring).getByText('Gravity')).toBeInTheDocument()
    expect(within(scoring).getByText('+0')).toBeInTheDocument()
    expect(within(scoring).getByText('Lines cleared')).toBeInTheDocument()
    for (const value of [
      '1: +100 × level × difficulty',
      '2: +300 × level × difficulty',
      '3: +500 × level × difficulty',
      '4: +800 × level × difficulty',
    ]) {
      expect(within(scoring).getByText(value)).toBeInTheDocument()
    }
    expect(
      within(scoring).getByText(
        'Difficulty multiplier: Easy 0.5×, Medium 1×, Hard 1.5×. Line-clear points also multiply by your level. Level increases every 10 lines and makes pieces fall faster.',
      ),
    ).toBeInTheDocument()
    expect(within(dialog).getByText('Keyboard controls')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close help' }))
    expect(screen.getByRole('button', { name: 'Help' })).toHaveFocus()
    expect(document.querySelector('.game-status')).toHaveTextContent('Paused')
    const announcements = screen.getByRole('status', {
      name: 'Game announcements',
    })
    act(() => publish?.(playing))
    const announcementBeforeSoftDrop = announcements.textContent
    act(() =>
      publish?.({ ...playing, score: 8 }, { clearing: false, action: 'soft-drop' }),
    )
    expect(announcements.textContent).toBe(announcementBeforeSoftDrop)
    vi.useFakeTimers()
    act(() =>
      publish?.(
        { ...playing, score: 307, lines: 10, level: 2 },
        { clearing: true, clearedLines: 2, clearPoints: 300 },
      ),
    )
    expect(announcements.textContent).toBe(
      'Cleared 2 lines. +300 points. Score 307. 10 lines cleared!',
    )
    expect(
      document.querySelector('.level-milestone-popup')?.textContent,
    ).toBe('10 lines cleared!')
    const callouts = [
      { clearedLines: 1, clearPoints: 100, name: 'Single' },
      { clearedLines: 2, clearPoints: 300, name: 'Double' },
      { clearedLines: 3, clearPoints: 500, name: 'Triple' },
      { clearedLines: 4, clearPoints: 800, name: 'Quad' },
    ]
    for (const callout of callouts) {
      act(() =>
        publish?.(
          { ...playing, score: 307, lines: 10, level: 2 },
          {
            clearing: true,
            clearedLines: callout.clearedLines,
            clearPoints: callout.clearPoints,
          },
        ),
      )
      expect(
        screen.getByText(`+${callout.clearPoints} · ${callout.name}`),
      ).toHaveAttribute('aria-hidden', 'true')
    }
    expect(screen.getByText('2')).toHaveClass('level-value-highlight')
    expect(screen.getByText('10')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(780)
    })
    expect(screen.getByText('+800 · Quad')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(780)
    })
    expect(screen.queryByText('+800 · Quad')).not.toBeInTheDocument()
    expect(document.querySelector('.level-milestone-popup')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(240)
    })
    expect(document.querySelector('.level-milestone-popup')).not.toBeInTheDocument()

    act(() =>
      publish?.({ ...playing, active: null, status: 'game-over', score: 42 }),
    )
    expect(screen.getByRole('group', { name: 'Game over' })).toBeInTheDocument()
    expect(announcements).toHaveTextContent('Game over.')
    expect(screen.getByLabelText('Score: 42')).toBeInTheDocument()

    act(() => publish?.(createGame(5)))
    expect(screen.getByText('Playing')).toBeInTheDocument()
    expect(screen.getByLabelText('Score: 0')).toBeInTheDocument()
  })

  it('shows themed notices at each ten-line milestone and clears them on restart', () => {
    vi.useFakeTimers()
    window.localStorage.setItem('games.block-drop.theme', 'tron')
    const initial = createGame(5)
    let publish: BlockDropStateListener | undefined
    const dispatch = vi.fn()
    const factory: BlockDropControllerFactory = (
      _canvas,
      _container,
      onStateChange,
    ) => {
      publish = onStateChange
      return {
        dispatch,
        destroy: vi.fn(),
        getState: () => initial,
      }
    }
    const { unmount } = render(<BlockDrop controllerFactory={factory} />)
    const popup = () => document.querySelector('.level-milestone-popup')
    const announceLines = (lines: number, level: number) => {
      const state = { ...initial, lines, level, score: lines * 100 }
      act(() =>
        publish?.(state, {
          clearing: true,
          clearedLines: 1,
          clearPoints: 100,
        }),
      )
      act(() => publish?.(state, { clearing: false }))
    }

    announceLines(9, 1)
    expect(popup()).toBeNull()

    announceLines(10, 2)
    expect(document.querySelector('.block-drop')).toHaveAttribute(
      'data-theme',
      'tron',
    )
    expect(popup()?.textContent).toBe('10 lines cleared!')
    expect(
      screen.getByRole('status', { name: 'Game announcements' }).textContent,
    ).toBe('Cleared 1 line. +100 points. Score 1000. 10 lines cleared!')
    fireEvent.click(screen.getByRole('button', { name: 'Move left' }))
    expect(dispatch).toHaveBeenCalledWith('left')
    act(() => {
      vi.advanceTimersByTime(500)
    })
    act(() => {
      vi.advanceTimersByTime(1800)
    })
    expect(popup()).toBeNull()

    announceLines(11, 2)
    expect(popup()).toBeNull()

    announceLines(20, 3)
    expect(popup()?.textContent).toBe('20 lines cleared!')
    expect(
      screen.getByRole('status', { name: 'Game announcements' }).textContent,
    ).toBe('Cleared 1 line. +100 points. Score 2000. 20 lines cleared!')

    announceLines(30, 4)
    expect(popup()?.textContent).toBe('30 lines cleared!')
    expect(
      screen.getByRole('status', { name: 'Game announcements' }).textContent,
    ).toBe('Cleared 1 line. +100 points. Score 3000. 30 lines cleared!')
    act(() => publish?.(createGame(5), { clearing: false, action: 'restart' }))
    expect(popup()).toBeNull()
    unmount()
  })

  it('centers every tetromino in a normalized six-cell preview frame', () => {
    let publish: ((state: ReturnType<typeof createGame>) => void) | undefined
    const initial = createGame(42)
    const expectedDimensions: Record<Tetromino, readonly [number, number]> = {
      I: [4, 1],
      J: [3, 2],
      L: [3, 2],
      O: [2, 2],
      S: [3, 2],
      T: [3, 2],
      Z: [3, 2],
    }
    const factory: BlockDropControllerFactory = (
      _canvas,
      _container,
      onStateChange,
    ) => {
      publish = onStateChange
      return {
        dispatch: vi.fn(),
        destroy: vi.fn(),
        getState: () => initial,
      }
    }

    render(<BlockDrop controllerFactory={factory} />)

    for (const type of TETROMINOES) {
      act(() => publish?.({ ...initial, next: type }))
      const region = screen.getByRole('region', {
        name: `Next piece: ${type} tetromino`,
      })
      const frame = region.querySelector<HTMLElement>('.next-piece-grid')
      const shape = region.querySelector<HTMLElement>('.next-piece-shape')
      const cells = Array.from(
        region.querySelectorAll<HTMLElement>('.next-piece-cell.is-filled'),
      )
      const columns = cells.map((cell) => Number(cell.style.gridColumn))
      const rows = cells.map((cell) => Number(cell.style.gridRow))
      const [width, height] = expectedDimensions[type]

      expect(region).toHaveTextContent(`${type} tetromino`)
      expect(frame).toHaveAttribute('data-frame-size', '6')
      expect(
        region.querySelectorAll('.next-piece-grid-cell'),
      ).toHaveLength(36)
      expect(shape).toHaveAttribute('data-width', String(width))
      expect(shape).toHaveAttribute('data-height', String(height))
      expect(cells).toHaveLength(4)
      expect(Math.min(...columns)).toBe(1)
      expect(Math.max(...columns)).toBe(width)
      expect(Math.min(...rows)).toBe(1)
      expect(Math.max(...rows)).toBe(height)
    }
  })

  it('announces clear feedback and disables gameplay until it finishes', () => {
    let publish: BlockDropStateListener | undefined
    const initial = createGame(5)
    const factory: BlockDropControllerFactory = (
      _canvas,
      _container,
      onStateChange,
    ) => {
      publish = onStateChange
      return {
        dispatch: vi.fn(),
        destroy: vi.fn(),
        getState: () => initial,
      }
    }

    render(<BlockDrop controllerFactory={factory} />)
    act(() => publish?.({ ...initial, score: 100 }, { clearing: true }))

    expect(screen.getByText('Clearing lines')).toBeInTheDocument()
    expect(screen.getByLabelText('Score: 100')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move left' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Hard drop' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Pause game' })).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: 'Restart game' }),
    ).not.toBeInTheDocument()

    act(() => publish?.({ ...initial, score: 100 }, { clearing: false }))
    expect(screen.getByText('Playing')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move left' })).toBeEnabled()
  })
})
