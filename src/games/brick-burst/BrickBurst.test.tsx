import { act, fireEvent, render, screen, within } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BrickBurst, type BrickBurstControllerFactory } from './BrickBurst'
import { applyAction, createGame, type BrickBurstEvent, type BrickBurstState } from './rules'
import type { BrickBurstStateListener } from './controller'
beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())
function setup(initial: Partial<BrickBurstState> = {}) {
  let state = { ...createGame(41), ...initial }
  let listener: BrickBurstStateListener = () => {}
  const destroy = vi.fn()
  const dispatch = vi.fn((action) => { state = applyAction(state, action); listener(state, action.type === 'restart' ? [{ type: 'level-started', level: 1 }] : []) })
  const factory: BrickBurstControllerFactory = vi.fn((_canvas, _board, onState) => { listener = onState; return { dispatch, destroy, getState: () => state } })
  const view = render(<BrickBurst controllerFactory={factory} />)
  return { ...view, dispatch, destroy, factory, publish: (patch: Partial<BrickBurstState>, events: BrickBurstEvent[] = []) => act(() => { state = { ...state, ...patch }; listener(state, events) }) }
}
describe('Brick Burst chrome', () => {
  it('shows lives as text and disables Serve unless a ball is waiting', () => {
    const t = setup()
    expect(screen.getByRole('img', { name: '3 lives' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Serve ball' })).toBeEnabled()
    const controls = screen.getByRole('group', { name: 'Brick Burst controls' })
    expect(within(controls).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Move paddle left', 'Serve ball', 'Move paddle right'])
    t.publish({ status: 'playing' }); expect(screen.getByRole('button', { name: 'Serve ball' })).toBeDisabled()
    t.publish({ status: 'ball-lost', lives: 2 }); expect(screen.getByRole('img', { name: '2 lives' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move paddle left' })).toBeDisabled()
  })
  it('uses the shared pause chrome, focuses Resume, and restores play focus', () => {
    setup(); fireEvent.click(screen.getByRole('button', { name: 'Pause game' }))
    const card = screen.getByRole('group', { name: 'Paused' })
    expect(within(card).getByRole('button', { name: 'Resume game' })).toHaveFocus()
    expect(card.querySelector('.game-overlay-card')!.outerHTML).toMatchSnapshot()
    fireEvent.click(within(card).getByRole('button', { name: 'Resume game' }))
    expect(screen.queryByRole('group', { name: 'Paused' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Brick Burst playfield' })).toHaveFocus()
  })
  it('saves a difficulty choice and shows its selected multiplier', () => {
    setup(); fireEvent.click(screen.getByRole('button', { name: 'Pause game' }))
    fireEvent.input(screen.getByRole('slider', { name: 'Difficulty' }), { target: { value: '2' } })
    expect(localStorage.getItem('games.brick-burst.difficulty')).toBe('hard')
    expect(document.querySelector('.brick-difficulty')).toHaveTextContent('Hard · 1.25×')
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', 'Hard, 1.25× speed and score, applies at next serve')
  })
  it('restores validated preferences and safely ignores bad values', () => {
    localStorage.setItem('games.brick-burst.difficulty', 'easy')
    const t = setup(); expect(vi.mocked(t.factory).mock.calls[0][3]?.difficulty).toBe('easy'); t.unmount()
    localStorage.setItem('games.brick-burst.difficulty', 'impossible'); localStorage.setItem('games.brick-burst.best-score', '-4')
    const next = setup({ status: 'over' }); expect(vi.mocked(next.factory).mock.calls[0][3]?.difficulty).toBe('medium')
    expect(screen.getByText('Best score').nextElementSibling).toHaveTextContent('0')
  })
  it('records a new best on game over, focuses Play again, and restarts', () => {
    localStorage.setItem('games.brick-burst.best-score', '50')
    const t = setup(); t.publish({ status: 'over', lives: 0, score: 120 }, [{ type: 'game-over', score: 120 }])
    expect(screen.getByText('New best')).toBeInTheDocument(); expect(screen.getByText('Best score').nextElementSibling).toHaveTextContent('120')
    expect(localStorage.getItem('games.brick-burst.best-score')).toBe('120')
    expect(screen.getByRole('button', { name: 'Play again' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Play again' })); expect(t.dispatch).toHaveBeenCalledWith({ type: 'restart' })
    expect(screen.getByRole('img', { name: '3 lives' })).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Serve ball' })).toBeEnabled()
  })
  it('announces only milestones, pause, and resume rather than brick scores', () => {
    const t = setup(); const live = screen.getByRole('status')
    expect(live).toHaveTextContent('Level 1. Tap or press Space to serve.')
    t.publish({ status: 'playing', score: 20 }, [{ type: 'brick-hit', row: 4, col: 5, kind: 'normal', broken: true, points: 20, impactX: 100, impactY: 100, ballVx: 0, ballVy: 300 }])
    expect(live).toHaveTextContent('Level 1. Tap or press Space to serve.')
    t.publish({ status: 'ball-lost', lives: 2 }, [{ type: 'ball-lost', livesLeft: 2 }]); expect(live).toHaveTextContent('Ball lost. 2 lives left.')
    t.publish({ status: 'level-clear', score: 1000 }, [{ type: 'level-cleared', level: 1, bonus: 500 }]); expect(live).toHaveTextContent('Level 1 cleared. Score 1000.')
    t.publish({ status: 'serving', level: 2 }, [{ type: 'level-started', level: 2 }]); expect(live).toHaveTextContent('Level 2. Tap or press Space to serve.')
    fireEvent.click(screen.getByRole('button', { name: 'Pause game' })); expect(live).toHaveTextContent('Paused')
    fireEvent.click(within(screen.getByRole('group', { name: 'Paused' })).getByRole('button', { name: 'Resume game' })); expect(live).toHaveTextContent('Resumed')
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })
  it('opens Help in reading order and returns focus on close', () => {
    setup(); fireEvent.click(screen.getByRole('button', { name: 'Pause game' })); fireEvent.click(screen.getByRole('button', { name: 'Help' }))
    const dialog = screen.getByRole('dialog', { name: 'Help' })
    expect(within(dialog).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['How to play', 'Scoring', 'Controls'])
    fireEvent.click(screen.getByRole('button', { name: 'Close help' })); expect(screen.getByRole('button', { name: 'Help' })).toHaveFocus()
  })
  it('destroys the session and restores page colors and theme metadata on unmount', () => {
    const root = document.documentElement
    root.style.setProperty('--bd-page', 'red'); root.setAttribute('data-brick-burst-theme', 'old')
    const meta = document.createElement('meta'); meta.name = 'theme-color'; meta.content = 'red'; document.head.append(meta)
    const t = setup(); expect(root.dataset.brickBurstTheme).toBe('classic'); expect(meta.content).toBe('#162033')
    t.unmount(); expect(t.destroy).toHaveBeenCalledTimes(1)
    expect(root.dataset.brickBurstTheme).toBe('old'); expect(root.style.getPropertyValue('--bd-page')).toBe('red'); expect(meta.content).toBe('red')
    meta.remove(); root.removeAttribute('data-brick-burst-theme'); root.style.removeProperty('--bd-page')
  })
})
