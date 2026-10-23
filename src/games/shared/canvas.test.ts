import { expect, it } from 'vitest'
import { alpha, align, clamp01, ease, hash, mix, roundRect } from './canvas'
import { recordingContext } from '../brick-burst/test-support'
it('provides deterministic canvas math to both games', () => {
  expect(hash(3, 5, 1)).toBe(hash(3, 5, 1))
  expect(hash(3, 5, 1)).toBeGreaterThanOrEqual(0); expect(hash(3, 5, 1)).toBeLessThan(1)
  expect(mix('#000000', '#ffffff', 0.5)).toBe('rgb(128 128 128)')
  expect(alpha('#67e8f9', 0.5)).toBe('rgb(103 232 249 / 0.5)')
  expect(clamp01(-1)).toBe(0); expect(clamp01(2)).toBe(1); expect(ease(0.5)).toBe(0.875)
  expect(align(1.2, 2)).toBe(1)
  const { context, calls } = recordingContext()
  roundRect(context, 0, 0, 10, 4, 8)
  expect(calls).toContainEqual(['roundRect', 0, 0, 10, 4, 2])
})
