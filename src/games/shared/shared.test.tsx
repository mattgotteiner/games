import { render } from '@testing-library/preact'
import { afterEach, expect, it, vi } from 'vitest'
import { readStored, writeStored } from './storage'
import { vibrate } from './haptics'
import { usePageColor } from './use-page-color'

afterEach(() => { vi.restoreAllMocks(); localStorage.clear() })
it('validates storage, including absent, invalid, and blocked values', () => {
  const parse = (raw: string) => /^\d+$/.test(raw) ? Number(raw) : undefined
  expect(readStored('test', parse, 7)).toBe(7)
  writeStored('test', '12'); expect(readStored('test', parse, 7)).toBe(12)
  writeStored('test', '-1'); expect(readStored('test', parse, 7)).toBe(7)
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw Error('blocked') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('blocked') })
  expect(readStored('test', parse, 7)).toBe(7)
  expect(() => writeStored('test', '3')).not.toThrow()
})
it('guards vibration for reduced motion and unsupported devices', () => {
  const request = vi.fn()
  vi.stubGlobal('navigator', { vibrate: request })
  vibrate(8, { reducedMotion: true }); expect(request).not.toHaveBeenCalled()
  vibrate([20, 40, 20], { reducedMotion: false }); expect(request).toHaveBeenCalledWith([20, 40, 20])
  vi.stubGlobal('navigator', {})
  expect(() => vibrate(8, { reducedMotion: false })).not.toThrow()
  vi.unstubAllGlobals()
})
it('restores an existing attribute, CSS value and priority, and meta color', () => {
  const root = document.documentElement
  root.setAttribute('data-test-theme', 'before')
  root.style.setProperty('--bd-page', 'red', 'important')
  const meta = document.createElement('meta'); meta.name = 'theme-color'; meta.content = 'red'; document.head.append(meta)
  function Test() { usePageColor('data-test-theme', 'classic', '#07111f', '#162033'); return null }
  const view = render(<Test />)
  expect(root.getAttribute('data-test-theme')).toBe('classic')
  expect(meta.content).toBe('#162033')
  view.unmount()
  expect(root.getAttribute('data-test-theme')).toBe('before')
  expect(root.style.getPropertyValue('--bd-page')).toBe('red')
  expect(root.style.getPropertyPriority('--bd-page')).toBe('important')
  expect(meta.content).toBe('red')
  meta.remove(); root.removeAttribute('data-test-theme'); root.style.removeProperty('--bd-page')
})
it('removes newly created page metadata on unmount', () => {
  function Test() { usePageColor('data-test-theme', 'classic', '#07111f', '#162033'); return null }
  const view = render(<Test />); view.unmount()
  expect(document.querySelector('meta[name="theme-color"]')).toBeNull()
  expect(document.documentElement.hasAttribute('data-test-theme')).toBe(false)
})
