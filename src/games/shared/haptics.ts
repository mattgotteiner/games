export function vibrate(pattern: number | number[], options: { reducedMotion?: boolean } = {}): void {
  if ((options.reducedMotion ?? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) ||
      typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate(pattern)
  } catch {
    // Some devices expose vibration but refuse the request.
  }
}
