import { act, fireEvent, render, screen } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'
import {
  BlockDrop,
  type BlockDropControllerFactory,
} from './games/block-drop/BlockDrop'
import { createGame } from './games/block-drop/rules'

describe('App', () => {
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

    expect(screen.getByRole('heading', { name: 'Block Drop' })).toBeInTheDocument()
    expect(screen.getByText('Playing')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Move left' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rotate clockwise' }))
    expect(dispatch).toHaveBeenNthCalledWith(1, 'left')
    expect(dispatch).toHaveBeenNthCalledWith(2, 'rotate')

    fireEvent.click(screen.getByRole('button', { name: /catalog/i }))
    expect(destroy).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Play Block Drop' })).toBeInTheDocument()
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
    fireEvent.click(screen.getByRole('button', { name: 'Restart game' }))
    expect(dispatch).toHaveBeenCalledWith('restart')
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
    expect(screen.getByText('Score: 7')).toBeInTheDocument()

    act(() =>
      publish?.({ ...playing, active: null, status: 'game-over', score: 42 }),
    )
    expect(screen.getByText('Game over')).toBeInTheDocument()
    expect(screen.getByText('Score: 42')).toBeInTheDocument()

    act(() => publish?.(createGame(5)))
    expect(screen.getByText('Playing')).toBeInTheDocument()
    expect(screen.getByText('Score: 0')).toBeInTheDocument()
  })
})
