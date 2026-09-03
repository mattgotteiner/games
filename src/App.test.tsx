import { act, fireEvent, render, screen } from '@testing-library/preact'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
import { applyAction, createGame } from './games/block-drop/rules'

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
  })

  it('launches Block Drop, routes touch actions, and returns with cleanup', () => {
    const dispatch = vi.fn()
    const destroy = vi.fn()
    const factory: BlockDropControllerFactory = vi.fn(() => ({
      dispatch,
      destroy,
      getState: () => createGame(5),
    }))
    render(<App blockDropControllerFactory={factory} />)

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
    fireEvent.click(screen.getByRole('button', { name: 'Move left' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rotate clockwise' }))
    expect(dispatch).toHaveBeenNthCalledWith(1, 'left')
    expect(dispatch).toHaveBeenNthCalledWith(2, 'rotate')

    fireEvent.click(screen.getByRole('button', { name: /catalog/i }))
    expect(destroy).toHaveBeenCalledOnce()
    expect(window.location.search).toBe('')
    expect(screen.getByRole('button', { name: 'Play Block Drop' })).toBeInTheDocument()
  })

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
    expect(screen.getByRole('status')).toHaveTextContent(
      'Downloading the latest version',
    )
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

  it('shows game over semantically with restart available', () => {
    const dispatch = vi.fn()
    const gameOver = { ...createGame(5), active: null, status: 'game-over' as const }
    const factory: BlockDropControllerFactory = (
      _canvas,
      _container,
      _onStateChange,
    ) => ({
      dispatch,
      destroy: vi.fn(),
      getState: () => gameOver,
    })

    render(<BlockDrop onReturn={vi.fn()} controllerFactory={factory} />)
    expect(screen.getByText('Game over')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move left' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Hard drop' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Restart game' }))
    expect(dispatch).toHaveBeenCalledWith('restart')
  })

  it('shows pause state, disables gameplay, and keeps resume and restart available', () => {
    let publish: ((state: ReturnType<typeof createGame>) => void) | undefined
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

    render(<BlockDrop onReturn={vi.fn()} controllerFactory={factory} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pause game' }))
    expect(dispatch).toHaveBeenCalledWith('pause')

    act(() => publish?.({ ...initial, status: 'paused' }))
    expect(screen.getByText('Paused')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move left' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Hard drop' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Resume game' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Restart game' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Resume game' }))
    fireEvent.click(screen.getByRole('button', { name: 'Restart game' }))
    expect(dispatch).toHaveBeenNthCalledWith(2, 'pause')
    expect(dispatch).toHaveBeenNthCalledWith(3, 'restart')
  })

  it('displays score semantically through play, game over, and restart', () => {
    let publish: ((state: ReturnType<typeof createGame>) => void) | undefined
    const playing = { ...createGame(5), score: 7 }
    const factory: BlockDropControllerFactory = (
      _canvas,
      _container,
      onStateChange,
    ) => {
      publish = onStateChange
      return {
        dispatch: vi.fn(),
        destroy: vi.fn(),
        getState: () => playing,
      }
    }

    render(<BlockDrop onReturn={vi.fn()} controllerFactory={factory} />)
    expect(screen.getByLabelText('Score: 7')).toBeInTheDocument()
    expect(
      screen.getByRole('complementary', { name: 'Game information' }),
    ).toBeInTheDocument()

    act(() =>
      publish?.({ ...playing, active: null, status: 'game-over', score: 42 }),
    )
    expect(screen.getByText('Game over')).toBeInTheDocument()
    expect(screen.getByLabelText('Score: 42')).toBeInTheDocument()

    act(() => publish?.(createGame(5)))
    expect(screen.getByText('Playing')).toBeInTheDocument()
    expect(screen.getByLabelText('Score: 0')).toBeInTheDocument()
  })

  it('renders an accessible four-by-four preview and updates it after a lock', () => {
    let publish: ((state: ReturnType<typeof createGame>) => void) | undefined
    const initial = createGame(42)
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

    const { container } = render(
      <BlockDrop onReturn={vi.fn()} controllerFactory={factory} />,
    )
    expect(
      screen.getByRole('region', {
        name: `Next piece: ${initial.next} tetromino`,
      }),
    ).toHaveTextContent(`${initial.next} tetromino`)
    expect(container.querySelectorAll('.next-piece-cell')).toHaveLength(16)
    expect(
      container.querySelectorAll('.next-piece-cell.is-filled'),
    ).toHaveLength(4)

    const locked = applyAction(initial, 'hard-drop')
    act(() => publish?.(locked))

    expect(
      screen.getByRole('region', {
        name: `Next piece: ${locked.next} tetromino`,
      }),
    ).toHaveTextContent(`${locked.next} tetromino`)
    expect(
      container.querySelectorAll('.next-piece-cell.is-filled'),
    ).toHaveLength(4)
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

    render(<BlockDrop onReturn={vi.fn()} controllerFactory={factory} />)
    act(() => publish?.({ ...initial, score: 100 }, { clearing: true }))

    expect(screen.getByText('Clearing lines')).toBeInTheDocument()
    expect(screen.getByLabelText('Score: 100')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move left' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Hard drop' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Pause game' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Restart game' })).toBeEnabled()

    act(() => publish?.({ ...initial, score: 100 }, { clearing: false }))
    expect(screen.getByText('Playing')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move left' })).toBeEnabled()
  })
})
