import { useEffect, useRef, useState } from 'preact/hooks'
import type { JSX } from 'preact'
import { BrickBurstController, type BrickBurstControllerOptions, type BrickBurstStateListener } from './controller'
import { BRICK_BURST_LOOKS } from './palette'
import { createGame, DIFFICULTIES, DIFFICULTY_ORDER, isDifficulty, type BrickBurstState } from './rules'
import { readStored, writeStored } from '../shared/storage'
import { vibrate } from '../shared/haptics'
import { usePageColor } from '../shared/use-page-color'
import './brick-burst.css'

export type BrickBurstControllerFactory = (
  canvas: HTMLCanvasElement, container: HTMLElement, listener: BrickBurstStateListener,
  options?: BrickBurstControllerOptions,
) => Pick<BrickBurstController, 'dispatch' | 'getState' | 'destroy'>
const defaultFactory: BrickBurstControllerFactory = (...args) => new BrickBurstController(...args)
const BEST_KEY = 'games.brick-burst.best-score', DIFFICULTY_KEY = 'games.brick-burst.difficulty'
const look = BRICK_BURST_LOOKS.classic
const tokens = Object.fromEntries(Object.entries(look.tokens).map(([name, value]) => [`--bd-${name}`, value])) as JSX.CSSProperties
const statusNames = { serving: 'Ready', playing: 'Playing', paused: 'Paused', 'ball-lost': 'Ball lost', 'level-clear': 'Level clear', over: 'Game over' } as const

export function BrickBurst({ controllerFactory = defaultFactory }: { readonly controllerFactory?: BrickBurstControllerFactory }) {
  const canvas = useRef<HTMLCanvasElement>(null), board = useRef<HTMLDivElement>(null), controls = useRef<HTMLDivElement>(null)
  const controller = useRef<ReturnType<BrickBurstControllerFactory> | null>(null)
  const resume = useRef<HTMLButtonElement>(null), again = useRef<HTMLButtonElement>(null), help = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDialogElement>(null), surface = useRef<HTMLDivElement>(null)
  const [state, setState] = useState(() => createGame(0, readStored(DIFFICULTY_KEY, (raw) => isDifficulty(raw) ? raw : undefined, 'medium')))
  const [best, setBest] = useState(() => readStored(BEST_KEY, (raw) => /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : undefined, 0))
  const bestRef = useRef(best), previous = useRef<BrickBurstState | null>(null)
  const [newBest, setNewBest] = useState(false), [announcement, setAnnouncement] = useState('')
  usePageColor('data-brick-burst-theme', look.id, look.tokens.page, look.metaThemeColor)

  useEffect(() => {
    if (!canvas.current || !board.current || !controls.current) return
    const receive: BrickBurstStateListener = (next, events) => {
      const prev = previous.current
      setState(next)
      if (next.status === 'over' && prev?.status !== 'over') {
        const improved = next.score > bestRef.current
        setNewBest(improved)
        if (improved) { bestRef.current = next.score; setBest(next.score); writeStored(BEST_KEY, String(next.score)) }
      } else if (next.status !== 'over') setNewBest(false)
      let message = ''
      if (!prev) message = `Level ${next.level}. Tap or press Space to serve.`
      else if (next.status === 'paused' && prev.status !== 'paused') message = 'Paused'
      else if (prev.status === 'paused' && next.status !== 'paused') message = 'Resumed'
      for (const e of events) {
        if (e.type === 'level-started') message = `Level ${e.level}. Tap or press Space to serve.`
        if (e.type === 'ball-lost') { message = `Ball lost. ${e.livesLeft} lives left.`; vibrate(40) }
        if (e.type === 'level-cleared') { message = `Level ${e.level} cleared. Score ${next.score}.`; vibrate([20, 40, 20]) }
        if (e.type === 'game-over') message = `Game over. Score ${e.score}.`
        if (e.type === 'brick-hit' && e.broken) vibrate(8)
      }
      if (message) setAnnouncement(message)
      previous.current = next
    }
    const instance = controllerFactory(canvas.current, board.current, receive, { difficulty: state.difficulty, controlBar: controls.current })
    controller.current = instance
    if (!previous.current) receive(instance.getState(), [])
    return () => { controller.current = null; previous.current = null; instance.destroy() }
  }, [controllerFactory])

  useEffect(() => {
    if (state.status === 'paused') resume.current?.focus()
    if (state.status === 'over') again.current?.focus()
  }, [state.status])
  const act = (type: 'pause' | 'resume' | 'restart') => {
    controller.current?.dispatch({ type })
    if (type !== 'pause') surface.current?.focus({ preventScroll: true })
  }
  const closeHelp = () => {
    if (typeof dialog.current?.close === 'function') dialog.current.close()
    else dialog.current?.removeAttribute('open')
    help.current?.focus()
  }
  const openHelp = () => {
    if (typeof dialog.current?.showModal === 'function') dialog.current.showModal()
    else dialog.current?.setAttribute('open', '')
  }
  const paused = state.status === 'paused', over = state.status === 'over'
  const canMove = state.status === 'serving' || state.status === 'playing'
  const difficulty = DIFFICULTIES[state.difficulty]
  return (
    <main class="brick-burst" data-theme="classic" style={tokens} aria-labelledby="brick-burst-heading">
      <header class="game-header">
        <div class="game-title"><h1 id="brick-burst-heading">Brick Burst</h1></div>
        <div class="session-actions" role="group" aria-label="Session actions">
          <button class="button-secondary session-action" type="button" aria-label={paused ? 'Resume game' : 'Pause game'} disabled={over}
            onClick={() => act(paused ? 'resume' : 'pause')}>
            <span class="control-symbol" aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span>
            <span class="button-caption">{paused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>
      </header>
      <div class="brick-burst-layout">
        <div class="board-frame" ref={board}>
          <div class="board-surface" ref={surface} tabIndex={-1} role="region" aria-label="Brick Burst playfield">
            <canvas ref={canvas} role="img" aria-label="Brick Burst board" />
            {state.status === 'serving' && <div class="serve-hint" aria-hidden="true"><span class="touch-hint">Drag to move · tap to serve</span><span class="keyboard-hint">← → to move · Space to serve</span></div>}
            {state.status === 'level-clear' && <div class="line-clear-callout" aria-hidden="true">Level {state.level} cleared</div>}
          </div>
          {paused && <div class="game-overlay pause-overlay" role="group" aria-labelledby="brick-pause-heading">
            <div class="game-overlay-card">
              <h2 id="brick-pause-heading">Paused</h2>
              <fieldset class="pause-difficulty">
                <legend><span>Difficulty</span><output>{difficulty.label} · {difficulty.multiplier}×</output></legend>
                <input type="range" min={0} max={2} step={1} value={DIFFICULTY_ORDER.indexOf(state.difficulty)} aria-label="Difficulty"
                  aria-valuetext={`${difficulty.label}, ${difficulty.multiplier}× speed and score, applies at next serve`}
                  onInput={(e) => {
                    const selected = DIFFICULTY_ORDER[Number(e.currentTarget.value)]
                    if (selected) { writeStored(DIFFICULTY_KEY, selected); controller.current?.dispatch({ type: 'set-difficulty', difficulty: selected }) }
                  }} />
                <div class="difficulty-ticks" aria-hidden="true">{DIFFICULTY_ORDER.map((d) => <span class={d === state.difficulty ? 'selected' : ''} key={d}>{DIFFICULTIES[d].label}</span>)}</div>
              </fieldset>
              <div class="overlay-actions">
                <button class="button-primary" ref={resume} type="button" aria-label="Resume game" onClick={() => act('resume')}>Resume</button>
                <button class="button-secondary" type="button" aria-label="Restart game" onClick={() => act('restart')}>Restart</button>
                <button class="button-secondary pause-help-action" type="button" ref={help} onClick={openHelp}>Help</button>
              </div>
            </div>
          </div>}
          {over && <div class="game-overlay game-over-overlay" role="group" aria-labelledby="brick-over-heading">
            <div class="game-overlay-card">
              <h2 id="brick-over-heading">Game over</h2>
              {newBest && <p class="new-best-indicator">New best</p>}
              <dl class="game-over-scores"><div><dt>Final score</dt><dd>{state.score}</dd></div><div><dt>Best score</dt><dd>{best}</dd></div></dl>
              <div class="overlay-actions game-over-actions"><button class="button-primary" ref={again} type="button" onClick={() => act('restart')}>Play again</button></div>
            </div>
          </div>}
        </div>
        <aside class="game-hud" aria-label="Game information">
          <p class="game-score" aria-label={`Score: ${state.score}`}><span class="hud-label">Score</span><strong class="game-score-value">{state.score.toLocaleString()}</strong></p>
          <p class="game-progress-item brick-level"><span class="hud-label">Level</span><strong>{state.level}</strong></p>
          <div class="brick-lives"><span class="hud-label">Lives</span><span class="lives" role="img" aria-label={`${state.lives} ${state.lives === 1 ? 'life' : 'lives'}`}>
            {[0, 1, 2].map((i) => <i class={i < state.lives ? 'life-pip alive' : 'life-pip'} key={i} aria-hidden="true" />)}
          </span><span class="visually-hidden" aria-hidden="true">{state.lives} lives</span></div>
          <div class="brick-state"><p class={`game-status status-${state.status === 'serving' ? 'playing' : state.status === 'over' ? 'game-over' : state.status === 'level-clear' || state.status === 'ball-lost' ? 'clearing' : state.status}`}><span class="status-dot" aria-hidden="true" />{statusNames[state.status]}</p>
            <p class="brick-difficulty" aria-label={`${difficulty.label} difficulty, ${difficulty.multiplier}× speed and score`}>{difficulty.label} · {difficulty.multiplier}×</p></div>
          <p class="keyboard-reference">← → / A D move · Space / ↑ serve · P pause · R restart</p>
        </aside>
        <div class={`control-bar${canMove ? '' : ' controls-inactive'}`} ref={controls} role="group" aria-label="Brick Burst controls">
          <button class="button-control" type="button" data-direction="-1" aria-disabled={!canMove || undefined} aria-label="Move paddle left" aria-keyshortcuts="ArrowLeft A"><span aria-hidden="true">◀</span> Left</button>
          <button class="button-primary" type="button" data-serve="" disabled={state.status !== 'serving'} aria-label="Serve ball" aria-keyshortcuts="Space ArrowUp">Serve</button>
          <button class="button-control" type="button" data-direction="1" aria-disabled={!canMove || undefined} aria-label="Move paddle right" aria-keyshortcuts="ArrowRight D">Right <span aria-hidden="true">▶</span></button>
        </div>
      </div>
      <p class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
      <dialog class="help-dialog" ref={dialog} aria-labelledby="brick-help-heading" onClose={() => help.current?.focus()}>
        <div class="dialog-heading-row"><h2 id="brick-help-heading">Help</h2><button class="button-secondary dialog-close" type="button" aria-label="Close help" onClick={closeHelp}>×</button></div>
        <div class="help-dialog-content">
          <section class="beginner-guide"><h3>How to play</h3><p>Keep the ball in play with your paddle and break every brick. Where the ball hits the paddle sets its angle: the center sends it straight up and the ends send it sideways.</p><p>Tough bricks have rivets and take two hits. You have three balls. Clear all the bricks to reach the next level.</p></section>
          <section class="beginner-guide"><h3>Scoring</h3><table><thead><tr><th>Brick rows</th><th>Points</th></tr></thead><tbody>{[40, 30, 20, 10].map((points, i) => <tr key={points}><td>{i * 2 + 1}–{i * 2 + 2}</td><td>{points}</td></tr>)}</tbody></table>
            <p>Tough bricks: 10 points for the first hit, twice the row points when broken. Level bonus: 500 × level.</p><p>Every award is multiplied by difficulty and rounded: Easy 0.75×, Medium 1×, Hard 1.25×. Changes apply at the next serve.</p></section>
          <section class="beginner-guide"><h3>Controls</h3><p>Touch: drag anywhere on the field or between the buttons to move; tap the field to serve. Hold Left or Right to steer.</p><p>Mouse: move over the field to steer; click to serve.</p><p>Keyboard: ← → or A D move, Space or ↑ serve, P pauses and resumes, R restarts. Activating Left or Right with the keyboard moves one step.</p></section>
        </div>
      </dialog>
    </main>
  )
}
