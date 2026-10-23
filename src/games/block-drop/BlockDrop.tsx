import { readStored, writeStored } from '../shared/storage'
import { vibrate } from '../shared/haptics'
import { usePageColor } from '../shared/use-page-color'
import { useEffect, useRef, useState } from 'preact/hooks'
import type { JSX } from 'preact'
import {
  BlockDropController,
  type BlockDropControllerOptions,
  type BlockDropStateListener,
} from './controller'
import {
  BLOCK_DROP_DIFFICULTIES,
  BLOCK_DROP_DIFFICULTY_ORDER,
  BLOCK_DROP_SCORING,
  getInitialPieceCells,
  type BlockDropDifficulty,
  type GameAction,
  type GameStatus,
  type Tetromino,
} from './rules'
import {
  BLOCK_DROP_THEME_ORDER,
  BLOCK_DROP_THEMES,
  isBlockDropThemeId,
  type BlockDropTheme,
  type BlockDropThemeId,
} from './themes'
import {
  IMPLEMENTED_BLOCK_DROP_THEME_ORDER,
  isBlockDropThemeImplemented,
} from './theme-renderers'

export type BlockDropControllerFactory = (
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  onStateChange: BlockDropStateListener,
  options?: BlockDropControllerOptions,
) => BlockDropControllerHandle

type BlockDropControllerHandle = Pick<
  BlockDropController,
  'dispatch' | 'destroy' | 'getState'
> &
  Partial<Pick<BlockDropController, 'setDifficulty' | 'setTheme'>>

export interface BlockDropProps {
  readonly controllerFactory?: BlockDropControllerFactory
}

type BlockDropControllerInstance = Pick<
  BlockDropController,
  'dispatch' | 'destroy' | 'getState'
> &
  Partial<Pick<BlockDropController, 'setDifficulty' | 'setTheme'>>

const createBlockDropController: BlockDropControllerFactory = (...args) =>
  new BlockDropController(...args)

const movementControls: ReadonlyArray<
  readonly [GameAction, string, string, string]
> = [
  ['left', 'Move left', '←', 'Left'],
  ['right', 'Move right', '→', 'Right'],
  ['soft-drop', 'Soft drop', '↓', 'Down'],
]

const LINE_CLEAR_NAMES = ['', 'Single', 'Double', 'Triple', 'Quad'] as const
const LEVEL_HIGHLIGHT_MS = 380
const LINE_CLEAR_CALLOUT_MS = 1560
const LEVEL_MILESTONE_NOTICE_MS = 1800

interface LineClearCallout {
  readonly id: number
  readonly points: number
  readonly clearedLines: number
}

interface LevelMilestoneNotice {
  readonly id: number
  readonly lines: number
}

interface GameplayControlProps {
  readonly action: GameAction
  readonly label: string
  readonly symbol: string
  readonly caption?: string
  readonly className: string
  readonly disabled: boolean
  readonly repeatable?: boolean
  readonly keyShortcuts?: string
  readonly isGameActive: Readonly<{ current: boolean }>
  readonly onAction: (action: GameAction) => void
}

function GameplayControl({
  action,
  label,
  symbol,
  caption,
  className,
  disabled,
  repeatable = false,
  keyShortcuts,
  isGameActive,
  onAction,
}: GameplayControlProps) {
  const heldPointer = useRef<number | null>(null)
  const initialRepeat = useRef<ReturnType<typeof setTimeout> | null>(null)
  const repeatInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const clickSuppression = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ignoreNextClick = useRef(false)
  const dispatchRef = useRef(onAction)
  const disabledRef = useRef(disabled)
  dispatchRef.current = onAction
  disabledRef.current = disabled

  const clearRepeatTimers = () => {
    if (initialRepeat.current !== null) {
      clearTimeout(initialRepeat.current)
      initialRepeat.current = null
    }
    if (repeatInterval.current !== null) {
      clearInterval(repeatInterval.current)
      repeatInterval.current = null
    }
  }

  const canAct = () => !disabledRef.current && isGameActive.current

  const expireClickSuppression = () => {
    if (clickSuppression.current !== null) {
      clearTimeout(clickSuppression.current)
    }
    clickSuppression.current = window.setTimeout(() => {
      ignoreNextClick.current = false
      clickSuppression.current = null
    }, 0)
  }

  const stopForInactiveGame = () => {
    clearRepeatTimers()
    heldPointer.current = null
  }

  useEffect(() => {
    if (disabled || !isGameActive.current) stopForInactiveGame()
  }, [disabled, isGameActive.current])

  useEffect(
    () => () => {
      clearRepeatTimers()
      if (clickSuppression.current !== null) {
        clearTimeout(clickSuppression.current)
      }
    },
    [],
  )

  const handlePointerDown = (
    event: JSX.TargetedPointerEvent<HTMLButtonElement>,
  ) => {
    if (!event.isPrimary || event.button !== 0 || !canAct()) return
    if (heldPointer.current !== null) return

    heldPointer.current = event.pointerId
    ignoreNextClick.current = true
    if (clickSuppression.current !== null) {
      clearTimeout(clickSuppression.current)
      clickSuppression.current = null
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture can fail if the browser has already cancelled the pointer.
    }
    dispatchRef.current(action)

    if (!repeatable) return
    initialRepeat.current = window.setTimeout(() => {
      initialRepeat.current = null
      if (!canAct()) {
        stopForInactiveGame()
        return
      }
      dispatchRef.current(action)
      if (!canAct()) {
        stopForInactiveGame()
        return
      }
      repeatInterval.current = window.setInterval(() => {
        if (!canAct()) {
          stopForInactiveGame()
          return
        }
        dispatchRef.current(action)
      }, 50)
    }, 170)
  }

  const handlePointerUp = (
    event: JSX.TargetedPointerEvent<HTMLButtonElement>,
  ) => {
    if (heldPointer.current !== event.pointerId) return
    clearRepeatTimers()
    heldPointer.current = null
    expireClickSuppression()
  }

  const handlePointerCancel = (
    event: JSX.TargetedPointerEvent<HTMLButtonElement>,
  ) => {
    if (heldPointer.current !== event.pointerId) return
    clearRepeatTimers()
    heldPointer.current = null
    ignoreNextClick.current = false
    if (clickSuppression.current !== null) {
      clearTimeout(clickSuppression.current)
      clickSuppression.current = null
    }
  }

  const handleLostPointerCapture = (
    event: JSX.TargetedPointerEvent<HTMLButtonElement>,
  ) => {
    if (heldPointer.current !== event.pointerId) return
    clearRepeatTimers()
    heldPointer.current = null
    expireClickSuppression()
  }

  const handleClick = (event: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    if (event.detail !== 0 || ignoreNextClick.current || !canAct()) {
      ignoreNextClick.current = false
      return
    }
    dispatchRef.current(action)
  }

  return (
    <button
      class={className}
      type="button"
      aria-label={label}
      aria-keyshortcuts={keyShortcuts}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handleLostPointerCapture}
      onClick={handleClick}
    >
      <span class="control-symbol" aria-hidden="true">
        {symbol}
      </span>
      {caption && <span class="control-caption">{caption}</span>}
    </button>
  )
}

function vibrateForGameEvent(
  presentation: Parameters<BlockDropStateListener>[1],
) {
  const duration = presentation?.clearedLines
    ? 20
    : presentation?.locked
      ? 10
      : 0
  if (duration) vibrate(duration)
}

const BEST_SCORE_STORAGE_KEY = 'games.block-drop.best-score'
const DIFFICULTY_STORAGE_KEY = 'games.block-drop.difficulty'
const THEME_STORAGE_KEY = 'games.block-drop.theme'

const availableThemeOrder = BLOCK_DROP_THEME_ORDER.filter((themeId) =>
  IMPLEMENTED_BLOCK_DROP_THEME_ORDER.includes(themeId),
)

function readBestScore(): number {
  return readStored(BEST_SCORE_STORAGE_KEY, (value) => {
    if (!/^\d+(?:\.5)?$/.test(value)) return undefined
    const score = Number(value)
    return Number.isSafeInteger(score) || Number.isSafeInteger(score * 2)
      ? score : undefined
  }, 0)
}

function writeBestScore(score: number): void {
  writeStored(BEST_SCORE_STORAGE_KEY, String(score))
}

function readDifficulty(): BlockDropDifficulty {
  return readStored(DIFFICULTY_STORAGE_KEY,
    (value) => BLOCK_DROP_DIFFICULTY_ORDER.find((difficulty) => difficulty === value), 'medium')
}

function writeDifficulty(difficulty: BlockDropDifficulty): void {
  writeStored(DIFFICULTY_STORAGE_KEY, difficulty)
}

function readTheme(): BlockDropThemeId {
  return readStored(THEME_STORAGE_KEY,
    (value) => isBlockDropThemeId(value) && isBlockDropThemeImplemented(value) ? value : undefined,
    'classic')
}

function writeTheme(themeId: BlockDropThemeId): void {
  writeStored(THEME_STORAGE_KEY, themeId)
}

function getThemeStyle(theme: BlockDropTheme): JSX.CSSProperties {
  return Object.fromEntries(
    Object.entries(theme.tokens).map(([name, value]) => [`--bd-${name}`, value]),
  ) as JSX.CSSProperties
}

function getThemeSwatchStyle(theme: BlockDropTheme): JSX.CSSProperties {
  return {
    '--swatch-board': theme.board.background,
    '--swatch-ring': theme.tokens['swatch-ring'],
    '--swatch-i': theme.pieces.I,
    '--swatch-o': theme.pieces.O,
    '--swatch-t': theme.pieces.T,
    '--swatch-z': theme.pieces.Z,
    '--swatch-highlight': theme.tokens['cell-highlight'],
    '--swatch-shadow': theme.tokens['cell-shadow'],
    '--swatch-font': theme.tokens['font-display'],
  } as JSX.CSSProperties
}

const PREVIEW_FRAME_SIZE = 4

function getPreviewShape(type: Tetromino) {
  const cells = getInitialPieceCells(type)
  const minX = Math.min(...cells.map(({ x }) => x))
  const maxX = Math.max(...cells.map(({ x }) => x))
  const minY = Math.min(...cells.map(({ y }) => y))
  const maxY = Math.max(...cells.map(({ y }) => y))

  return {
    cells: cells.map(({ x, y }) => ({ x: x - minX, y: y - minY })),
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

function PiecePreview({
  label,
  type,
  theme,
}: {
  readonly label: 'Hold' | 'Next'
  readonly type: Tetromino | null
  readonly theme: BlockDropTheme
}) {
  const shape = type === null ? null : getPreviewShape(type)
  const offsetX =
    shape === null ? 0 : Math.floor((PREVIEW_FRAME_SIZE - shape.width) / 2)
  const offsetY =
    shape === null ? 0 : Math.floor((PREVIEW_FRAME_SIZE - shape.height) / 2)
  const filledCells = new Set(
    shape?.cells.map(({ x, y }) => `${x + offsetX},${y + offsetY}`),
  )
  const accessibleLabel =
    label === 'Hold'
      ? type === null
        ? 'Held piece: empty'
        : `Held piece: ${type} tetromino`
      : `Next piece: ${type} tetromino`

  return (
    <section
      class={`next-piece${label === 'Hold' ? ' hold-piece' : ''}`}
      aria-label={accessibleLabel}
    >
      <p class="hud-label">{label}</p>
      <div
        class="next-piece-grid"
        data-frame-size={PREVIEW_FRAME_SIZE}
        data-piece-width={shape?.width ?? 0}
        data-piece-height={shape?.height ?? 0}
        aria-hidden="true"
      >
        {Array.from(
          { length: PREVIEW_FRAME_SIZE * PREVIEW_FRAME_SIZE },
          (_, index) => {
            const column = index % PREVIEW_FRAME_SIZE
            const row = Math.floor(index / PREVIEW_FRAME_SIZE)
            const isFilled = filledCells.has(`${column},${row}`)

            return (
              <span
                class={`next-piece-grid-cell${
                  isFilled ? ' next-piece-cell is-filled' : ''
                }`}
                key={index}
                style={
                  isFilled && type !== null
                    ? ({ '--piece': theme.pieces[type] } as JSX.CSSProperties)
                    : undefined
                }
              />
            )
          },
        )}
      </div>
      <p class="next-piece-name">
        {type === null ? 'Empty' : `${type} tetromino`}
      </p>
    </section>
  )
}

function ScoringGuide() {
  return (
    <section class="scoring-guide" aria-labelledby="scoring-guide-heading">
      <h4 class="hud-label" id="scoring-guide-heading">
        Scoring
      </h4>
      <dl class="scoring-rules">
        <div class="scoring-rule">
          <dt>Soft drop</dt>
          <dd>+{BLOCK_DROP_SCORING.softDropPerRow} / row × difficulty</dd>
        </div>
        <div class="scoring-rule">
          <dt>Hard drop</dt>
          <dd>+{BLOCK_DROP_SCORING.hardDropPerRow} / row × difficulty</dd>
        </div>
        <div class="scoring-rule">
          <dt>Gravity</dt>
          <dd>+{BLOCK_DROP_SCORING.gravityPerRow}</dd>
        </div>
        <div class="scoring-rule scoring-rule-lines">
          <dt>Lines cleared</dt>
          <dd>
            {Object.entries(BLOCK_DROP_SCORING.lineClears).map(
              ([count, points]) => (
                <span key={count}>
                  {count}: +{points} × level × difficulty
                </span>
              ),
            )}
          </dd>
        </div>
      </dl>
      <p class="scoring-level-note">
        Difficulty multiplier: Easy 0.5×, Medium 1×, Hard 1.5×. Line-clear
        points also multiply by your level. Level increases every 10 lines and
        makes pieces fall faster.
      </p>
    </section>
  )
}

export function BlockDrop({
  controllerFactory = createBlockDropController,
}: BlockDropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const boardSurfaceRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const helpButtonRef = useRef<HTMLButtonElement>(null)
  const resumeButtonRef = useRef<HTMLButtonElement>(null)
  const playAgainButtonRef = useRef<HTMLButtonElement>(null)
  const helpDialogRef = useRef<HTMLDialogElement>(null)
  const isGameActive = useRef(false)
  const lastAnnouncedStatus = useRef<GameStatus | null>(null)
  const lastAnnouncedLevel = useRef(1)
  const focusStatus = useRef<GameStatus>('playing')
  const postOverlayGestureTimer = useRef<number | null>(null)
  const levelHighlightTimer = useRef<number | null>(null)
  const lineClearCalloutTimer = useRef<number | null>(null)
  const lineClearCalloutSequence = useRef(0)
  const levelMilestoneNoticeTimer = useRef<number | null>(null)
  const levelMilestoneNoticeSequence = useRef(0)
  const statusRef = useRef<GameStatus>('playing')
  const controllerRef = useRef<BlockDropControllerInstance | null>(null)
  const [bestScore, setBestScore] = useState(readBestScore)
  const bestScoreRef = useRef(bestScore)
  const [newBest, setNewBest] = useState(false)
  const [controller, setController] =
    useState<BlockDropControllerInstance | null>(null)
  const [status, setStatus] = useState<GameStatus>('playing')
  const [difficulty, setDifficulty] = useState<BlockDropDifficulty>(readDifficulty)
  const [themeId, setThemeId] = useState<BlockDropThemeId>(readTheme)
  const [postOverlayGestureLock, setPostOverlayGestureLock] = useState(false)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [levelHighlight, setLevelHighlight] = useState(false)
  const [lineClearCallout, setLineClearCallout] =
    useState<LineClearCallout | null>(null)
  const [levelMilestoneNotice, setLevelMilestoneNotice] =
    useState<LevelMilestoneNotice | null>(null)
  const [next, setNext] = useState<Tetromino>('I')
  const [heldPiece, setHeldPiece] = useState<Tetromino | null>(null)
  const [holdUsed, setHoldUsed] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const theme = BLOCK_DROP_THEMES[themeId]
  const themeStyle = getThemeStyle(theme)

  const recordFinalScore = (finalScore: number) => {
    if (finalScore > bestScoreRef.current) {
      bestScoreRef.current = finalScore
      setBestScore(finalScore)
      setNewBest(true)
      writeBestScore(finalScore)
    } else {
      setNewBest(false)
    }
  }

  useEffect(() => {
    if (canvasRef.current === null || boardRef.current === null) return
    const controller = controllerFactory(
      canvasRef.current,
      boardRef.current,
      (state, presentation) => {
        const previousStatus = lastAnnouncedStatus.current
        const previousLevel = lastAnnouncedLevel.current
        statusRef.current = state.status
        isGameActive.current =
          state.status === 'playing' && !(presentation?.clearing ?? false)
        setStatus(state.status)
        setDifficulty(state.difficulty)
        setScore(state.score)
        setLines(state.lines)
        setLevel(state.level)
        setNext(state.next)
        setHeldPiece(state.heldPiece)
        setHoldUsed(state.holdUsed)
        setClearing(presentation?.clearing ?? false)
        vibrateForGameEvent(presentation)

        if (state.level > previousLevel) {
          setLevelHighlight(true)
          if (levelHighlightTimer.current !== null) {
            window.clearTimeout(levelHighlightTimer.current)
          }
          levelHighlightTimer.current = window.setTimeout(() => {
            setLevelHighlight(false)
            levelHighlightTimer.current = null
          }, LEVEL_HIGHLIGHT_MS)
          const milestoneLines = Math.floor(state.lines / 10) * 10
          if (milestoneLines > 0) {
            setLevelMilestoneNotice({
              id: ++levelMilestoneNoticeSequence.current,
              lines: milestoneLines,
            })
            if (levelMilestoneNoticeTimer.current !== null) {
              window.clearTimeout(levelMilestoneNoticeTimer.current)
            }
            levelMilestoneNoticeTimer.current = window.setTimeout(() => {
              setLevelMilestoneNotice(null)
              levelMilestoneNoticeTimer.current = null
            }, LEVEL_MILESTONE_NOTICE_MS)
          }
        } else if (state.level < previousLevel) {
          setLevelHighlight(false)
          if (levelHighlightTimer.current !== null) {
            window.clearTimeout(levelHighlightTimer.current)
            levelHighlightTimer.current = null
          }
        }
        lastAnnouncedLevel.current = state.level

        if (
          presentation?.clearedLines !== undefined &&
          presentation.clearPoints !== undefined
        ) {
          setLineClearCallout({
            id: ++lineClearCalloutSequence.current,
            points: presentation.clearPoints,
            clearedLines: presentation.clearedLines,
          })
          if (lineClearCalloutTimer.current !== null) {
            window.clearTimeout(lineClearCalloutTimer.current)
          }
          lineClearCalloutTimer.current = window.setTimeout(() => {
            setLineClearCallout(null)
            lineClearCalloutTimer.current = null
          }, LINE_CLEAR_CALLOUT_MS)
        }

        if (
          state.status === 'playing' &&
          (previousStatus === 'paused' || previousStatus === 'game-over')
        ) {
          setPostOverlayGestureLock(true)
          if (postOverlayGestureTimer.current !== null) {
            window.clearTimeout(postOverlayGestureTimer.current)
          }
          postOverlayGestureTimer.current = window.setTimeout(() => {
            setPostOverlayGestureLock(false)
            postOverlayGestureTimer.current = null
          }, 500)
        }

        if (presentation?.action === 'restart') {
          setNewBest(false)
          setLevelHighlight(false)
          setLineClearCallout(null)
          setLevelMilestoneNotice(null)
          if (levelHighlightTimer.current !== null) {
            window.clearTimeout(levelHighlightTimer.current)
            levelHighlightTimer.current = null
          }
          if (lineClearCalloutTimer.current !== null) {
            window.clearTimeout(lineClearCalloutTimer.current)
            lineClearCalloutTimer.current = null
          }
          if (levelMilestoneNoticeTimer.current !== null) {
            window.clearTimeout(levelMilestoneNoticeTimer.current)
            levelMilestoneNoticeTimer.current = null
          }
          boardSurfaceRef.current?.focus()
        } else if (
          state.status === 'game-over' &&
          previousStatus !== 'game-over'
        ) {
          recordFinalScore(state.score)
        } else if (
          state.status === 'playing' &&
          (previousStatus === 'paused' || previousStatus === 'game-over')
        ) {
          setNewBest(false)
        }

        let message = ''
        if (presentation?.clearedLines) {
          const count = presentation.clearedLines
          const pointsMessage =
            presentation.clearPoints === undefined
              ? ''
              : ` +${presentation.clearPoints} points.`
          message =
            `Cleared ${count} ${count === 1 ? 'line' : 'lines'}.` +
            `${pointsMessage} Score ${state.score}.`
          if (state.level > previousLevel) {
            const milestoneLines = Math.floor(state.lines / 10) * 10
            message += ` ${milestoneLines} lines cleared!`
          }
          if (state.status === 'game-over') message += ' Game over.'
        } else if (
          previousStatus === 'playing' &&
          state.status === 'paused'
        ) {
          message = 'Game paused.'
        } else if (
          previousStatus === 'paused' &&
          state.status === 'playing' &&
          presentation?.action !== 'restart'
        ) {
          message = 'Game resumed.'
        } else if (
          previousStatus !== 'game-over' &&
          state.status === 'game-over'
        ) {
          message = 'Game over.'
        }
        if (message) setAnnouncement(message)
        lastAnnouncedStatus.current = state.status
      },
      { difficulty, theme: themeId },
    )
    controllerRef.current = controller
    setController(controller)
    const initialState = controller.getState()
    statusRef.current = initialState.status
    setStatus(initialState.status)
    setDifficulty(initialState.difficulty)
    setScore(initialState.score)
    setLines(initialState.lines)
    setLevel(initialState.level)
    lastAnnouncedLevel.current = initialState.level
    setNext(initialState.next)
    isGameActive.current = initialState.status === 'playing'
    lastAnnouncedStatus.current = initialState.status
    if (initialState.status === 'game-over') {
      recordFinalScore(initialState.score)
    }
    return () => {
      isGameActive.current = false
      if (postOverlayGestureTimer.current !== null) {
        window.clearTimeout(postOverlayGestureTimer.current)
        postOverlayGestureTimer.current = null
      }
      if (levelHighlightTimer.current !== null) {
        window.clearTimeout(levelHighlightTimer.current)
        levelHighlightTimer.current = null
      }
      if (lineClearCalloutTimer.current !== null) {
        window.clearTimeout(lineClearCalloutTimer.current)
        lineClearCalloutTimer.current = null
      }
      if (levelMilestoneNoticeTimer.current !== null) {
        window.clearTimeout(levelMilestoneNoticeTimer.current)
        levelMilestoneNoticeTimer.current = null
      }
      controllerRef.current = null
      controller.destroy()
    }
  }, [controllerFactory])

  usePageColor('data-block-drop-theme', theme.id, theme.tokens.page, theme.metaThemeColor)

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'hidden' &&
        statusRef.current === 'playing'
      ) {
        controllerRef.current?.dispatch('pause')
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    const controls = controlsRef.current
    if (controls === null) return
    const preventSelection = (event: Event) => event.preventDefault()
    controls.addEventListener('selectstart', preventSelection)
    return () => controls.removeEventListener('selectstart', preventSelection)
  }, [])

  useEffect(() => {
    const previousStatus = focusStatus.current
    if (status === 'paused') {
      resumeButtonRef.current?.focus()
    } else if (status === 'game-over') {
      playAgainButtonRef.current?.focus()
    } else if (
      status === 'playing' &&
      (previousStatus === 'paused' || previousStatus === 'game-over')
    ) {
      boardSurfaceRef.current?.focus()
    }
    focusStatus.current = status
  }, [status])

  const act = (action: GameAction) => controller?.dispatch(action)
  const chooseTheme = (selectedTheme: BlockDropThemeId) => {
    setThemeId(selectedTheme)
    writeTheme(selectedTheme)
    controllerRef.current?.setTheme?.(selectedTheme)
  }
  const paused = status === 'paused'
  const controlsInactive = paused || status === 'game-over'
  const controlsGestureLocked =
    controlsInactive || postOverlayGestureLock
  const gameplayDisabled =
    controller === null || paused || clearing || status === 'game-over'
  const statusText = clearing
    ? 'Clearing lines'
    : status === 'playing'
      ? 'Playing'
      : status === 'paused'
        ? 'Paused'
        : 'Game over'

  const openHelp = () => {
    if (status === 'playing') act('pause')
    const dialog = helpDialogRef.current
    if (dialog && !dialog.open) {
      try {
        dialog.showModal()
      } catch {
        dialog.setAttribute('open', '')
      }
    }
  }

  const closeHelp = () => {
    const dialog = helpDialogRef.current
    if (dialog?.open) {
      try {
        dialog.close()
      } catch {
        dialog.removeAttribute('open')
      }
      helpButtonRef.current?.focus()
    }
  }

  const returnFocusToHelp = () => helpButtonRef.current?.focus()

  return (
    <main
      class="block-drop"
      data-theme={themeId}
      style={themeStyle}
      aria-labelledby="block-drop-heading"
    >
      <header class="game-header">
        <div class="game-title">
          <h1 id="block-drop-heading">Block Drop</h1>
        </div>
        <div class="session-actions" role="group" aria-label="Session actions">
          <button
            class="button-secondary session-action"
            type="button"
            aria-label={paused ? 'Resume game' : 'Pause game'}
            disabled={
              controller === null || status === 'game-over' || clearing
            }
            onClick={() => act('pause')}
          >
            <span class="control-symbol" aria-hidden="true">
              {paused ? '▶' : 'Ⅱ'}
            </span>
            <span class="button-caption">{paused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>
      </header>

      <div class="game-layout">
        <div class="game-stage">
          <div class="board-frame" ref={boardRef}>
            <div
              class="board-surface"
              ref={boardSurfaceRef}
              tabIndex={-1}
              role="region"
              aria-label="Block Drop playfield"
            >
              <canvas
                ref={canvasRef}
                aria-label="Block Drop board"
                role="img"
              />
            </div>
            {lineClearCallout && (
              <div
                class="line-clear-callout"
                aria-hidden="true"
                key={lineClearCallout.id}
              >
                +{lineClearCallout.points} ·{' '}
                {LINE_CLEAR_NAMES[lineClearCallout.clearedLines]}
              </div>
            )}
            {levelMilestoneNotice && (
              <div
                class="level-milestone-popup"
                aria-hidden="true"
                key={levelMilestoneNotice.id}
              >
                {levelMilestoneNotice.lines} lines cleared!
              </div>
            )}
            {paused && (
              <div
                class="game-overlay pause-overlay"
                role="group"
                aria-labelledby="pause-overlay-heading"
              >
                <div class="game-overlay-card">
                  <h2 id="pause-overlay-heading">Paused</h2>
                  <fieldset class="pause-difficulty">
                    <legend>
                      <span>Difficulty</span>
                      <output>
                        {BLOCK_DROP_DIFFICULTIES[difficulty].label} ·{' '}
                        {BLOCK_DROP_DIFFICULTIES[difficulty].description}
                      </output>
                    </legend>
                    <input
                      type="range"
                      min={0}
                      max={BLOCK_DROP_DIFFICULTY_ORDER.length - 1}
                      step={1}
                      value={BLOCK_DROP_DIFFICULTY_ORDER.indexOf(difficulty)}
                      aria-label="Difficulty"
                      aria-valuetext={`${BLOCK_DROP_DIFFICULTIES[difficulty].label}, ${BLOCK_DROP_DIFFICULTIES[difficulty].description.toLowerCase()}`}
                      onInput={(event) => {
                        const selected = BLOCK_DROP_DIFFICULTY_ORDER[
                          Number(event.currentTarget.value)
                        ]
                        if (selected !== undefined) {
                          setDifficulty(selected)
                          writeDifficulty(selected)
                          controllerRef.current?.setDifficulty?.(selected)
                        }
                      }}
                    />
                    <div class="difficulty-ticks" aria-hidden="true">
                      {BLOCK_DROP_DIFFICULTY_ORDER.map((option) => (
                        <span
                          class={option === difficulty ? 'selected' : ''}
                          key={option}
                        >
                          {BLOCK_DROP_DIFFICULTIES[option].label}
                        </span>
                      ))}
                    </div>
                  </fieldset>
                  <div class="overlay-actions">
                    <button
                      class="button-primary"
                      type="button"
                      aria-label="Resume game"
                      ref={resumeButtonRef}
                      onClick={() => act('pause')}
                    >
                      Resume
                    </button>
                    <button
                      class="button-secondary"
                      type="button"
                      aria-label="Restart game"
                      onClick={() => act('restart')}
                    >
                      Restart
                    </button>
                    <button
                      class="button-secondary pause-help-action"
                      type="button"
                      aria-label="Help"
                      ref={helpButtonRef}
                      onClick={openHelp}
                    >
                      Help
                    </button>
                  </div>
                  <fieldset class="pause-theme">
                    <legend>
                      <span>Theme</span>
                      <output aria-live="polite">Selected: {theme.label}</output>
                    </legend>
                    <div class="theme-options">
                      {availableThemeOrder.map((optionId) => {
                        const option = BLOCK_DROP_THEMES[optionId]
                        const isSelected = themeId === option.id
                        return (
                          <label
                            class="theme-option"
                            data-theme-option={option.id}
                            data-selected={isSelected ? 'true' : undefined}
                            style={getThemeSwatchStyle(option)}
                            key={option.id}
                          >
                            <input
                              class="visually-hidden"
                              type="radio"
                              name="block-drop-theme"
                              value={option.id}
                              checked={isSelected}
                              onChange={() => chooseTheme(option.id)}
                            />
                            <span class="theme-swatch" aria-hidden="true">
                              <i />
                              <i />
                              <i />
                              <i />
                            </span>
                            <span class="theme-option-label">
                              {option.label}
                            </span>
                            {isSelected && (
                              <span class="theme-selected-badge" aria-hidden="true">
                                Selected
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </fieldset>
                </div>
              </div>
            )}
            {status === 'game-over' && (
              <div
                class="game-overlay game-over-overlay"
                role="group"
                aria-labelledby="game-over-heading"
                onDblClick={(event) => event.preventDefault()}
              >
                <div class="game-overlay-card">
                  <h2 id="game-over-heading">Game over</h2>
                  {newBest && <p class="new-best-indicator">New best</p>}
                  <dl class="game-over-scores">
                    <div>
                      <dt>Final score</dt>
                      <dd>{score}</dd>
                    </div>
                    <div>
                      <dt>Best score</dt>
                      <dd>{bestScore}</dd>
                    </div>
                  </dl>
                  <div class="overlay-actions game-over-actions">
                    <button
                      class="button-primary"
                      type="button"
                      aria-label="Play again"
                      ref={playAgainButtonRef}
                      onClick={() => act('restart')}
                    >
                      Play again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <aside class="game-hud" aria-label="Game information">
            <p
              class="game-score"
              aria-label={`Score: ${score}`}
            >
              <span class="hud-label">Score</span>
              <strong class="game-score-value">{score}</strong>
            </p>
            <div
              class="game-progress"
              role="group"
              aria-label={`Level ${level}, ${lines} lines cleared, ${BLOCK_DROP_DIFFICULTIES[difficulty].label} difficulty`}
            >
              <p class="game-progress-item">
                <span class="hud-label">Level</span>
                <strong
                  class={`level-value${levelHighlight ? ' level-value-highlight' : ''}`}
                  key={level}
                >
                  {level}
                </strong>
              </p>
              <p class="game-progress-item">
                <span class="hud-label">Lines</span>
                <strong>{lines}</strong>
              </p>
              <p class="game-progress-item">
                <span class="hud-label">Difficulty</span>
                <strong class="difficulty-value">
                  <span>{BLOCK_DROP_DIFFICULTIES[difficulty].label}</span>
                  <span class="difficulty-multiplier">
                    {BLOCK_DROP_DIFFICULTIES[difficulty].speed}×
                  </span>
                </strong>
              </p>
            </div>
            <p
              class={`game-status status-${clearing ? 'clearing' : status}`}
            >
              <span class="status-dot" aria-hidden="true" />
              {statusText}
            </p>
            <div
              class="piece-previews"
              role="group"
              aria-label="Piece previews"
            >
              <PiecePreview label="Hold" type={heldPiece} theme={theme} />
              <PiecePreview label="Next" type={next} theme={theme} />
            </div>
          </aside>
        </div>

        <div
          ref={controlsRef}
          class={`game-controls${
            controlsGestureLocked ? ' gesture-locked' : ''
          }${controlsInactive ? ' controls-inactive' : ''}`}
          role="group"
          aria-label="Block Drop controls"
        >
          <div
            class="control-group movement-controls"
            role="group"
            aria-label="Movement and soft drop controls"
          >
            {movementControls.map(([action, label, symbol, caption]) => (
              <GameplayControl
                className={`button-control control-${action}`}
                action={action}
                label={label}
                symbol={symbol}
                caption={caption}
                disabled={gameplayDisabled}
                repeatable
                isGameActive={isGameActive}
                onAction={act}
                key={action}
              />
            ))}
          </div>
          <div
            class="control-group hold-controls"
            role="group"
            aria-label="Hold control"
          >
            <GameplayControl
              className="button-control control-hold"
              action="hold"
              label="Hold piece"
              symbol="⇄"
              caption="Hold"
              keyShortcuts="C"
              disabled={gameplayDisabled || holdUsed}
              isGameActive={isGameActive}
              onAction={act}
            />
          </div>
          <div
            class="control-group action-controls"
            role="group"
            aria-label="Rotation and drop controls"
          >
            <GameplayControl
              className="button-control control-rotate"
              action="rotate"
              label="Rotate clockwise"
              symbol="↻"
              caption="Rotate"
              disabled={gameplayDisabled}
              isGameActive={isGameActive}
              onAction={act}
            />
            <GameplayControl
              className="button-primary control-hard-drop"
              action="hard-drop"
              label="Hard drop"
              symbol="⇊"
              caption="Drop"
              disabled={gameplayDisabled}
              isGameActive={isGameActive}
              onAction={act}
            />
          </div>
          <p class="key-help">
            Keys: arrows move and rotate, C holds, Space drops, P pauses, R
            restarts.
          </p>
        </div>
      </div>

      <dialog
        class="help-dialog"
        ref={helpDialogRef}
        aria-labelledby="help-dialog-heading"
        onClose={returnFocusToHelp}
        onCancel={(event) => {
          event.preventDefault()
          closeHelp()
        }}
      >
        <div class="dialog-heading-row">
          <h2 id="help-dialog-heading">Help</h2>
          <button
            class="button-quiet dialog-close"
            type="button"
            aria-label="Close help"
            onClick={closeHelp}
          >
            ×
          </button>
        </div>
        <div class="help-dialog-content">
          <section
            class="beginner-guide"
            aria-labelledby="how-to-play-heading"
          >
            <h3 id="how-to-play-heading">How to play</h3>
            <p>
              Each piece has four squares and falls from the top. Move and turn
              it to fit with the pieces already on the board. Fill a whole row
              from edge to edge and it clears, bringing the pieces above it
              down.
            </p>
            <p>
              Drop places a piece instantly. Hold saves your piece for later,
              once before the next piece locks. Clear lines and keep playing.
              The game ends if there is no room for the next piece, or any part
              of a piece is still above the board when it lands.
            </p>
          </section>
          <section
            class="scoring-reference"
            aria-labelledby="scoring-controls-heading"
          >
            <h3 id="scoring-controls-heading">Scoring and controls</h3>
            <ScoringGuide />
            <section
              class="keyboard-guide"
              aria-labelledby="keyboard-guide-heading"
            >
              <h4 id="keyboard-guide-heading">Keyboard controls</h4>
              <dl>
                <div>
                  <dt>← / →</dt>
                  <dd>Move left or right</dd>
                </div>
                <div>
                  <dt>↑</dt>
                  <dd>Rotate clockwise</dd>
                </div>
                <div>
                  <dt>↓</dt>
                  <dd>Soft drop</dd>
                </div>
                <div>
                  <dt>Space</dt>
                  <dd>Hard drop</dd>
                </div>
                <div>
                  <dt>C</dt>
                  <dd>Hold or swap the active piece</dd>
                </div>
                <div>
                  <dt>P</dt>
                  <dd>Pause or resume (when help is closed)</dd>
                </div>
                <div>
                  <dt>R</dt>
                  <dd>Restart the game (when help is closed)</dd>
                </div>
              </dl>
            </section>
          </section>
        </div>
      </dialog>
      <div
        class="visually-hidden"
        role="status"
        aria-label="Game announcements"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
    </main>
  )
}
