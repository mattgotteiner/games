import { vi } from 'vitest'
import type { DrawContext } from './renderer'
export function recordingContext() {
  const calls: unknown[] = []
  const gradient = { addColorStop: (...args: unknown[]) => calls.push(['colorStop', ...args]) }
  const target: Record<string, unknown> = { px: 1, align: (n: number) => n }
  const context = new Proxy(target, {
    get(t, name: string) {
      if (name in t) return t[name]
      return (...args: unknown[]) => { calls.push([name, ...args]); return name.startsWith('create') ? gradient : undefined }
    },
    set(t, name: string, value) { calls.push([name, value === gradient ? "[gradient]" : value]); t[name] = value; return true },
  }) as unknown as DrawContext
  return { context, calls }
}
export function pointer(target: HTMLElement, type: string, x: number, y = 200, init: Partial<PointerEvent> = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(event, { clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, ...init })
  target.dispatchEvent(event)
}
export function fakeObserver() { return { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() } as unknown as ResizeObserver }
