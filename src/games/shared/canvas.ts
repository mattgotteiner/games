export function hash(x: number, y: number, salt = 0): number {
  let value = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296
}

export function mix(hex: string, target: string, amount: number): string {
  const a = Number.parseInt(hex.slice(1), 16)
  const b = Number.parseInt(target.slice(1), 16)
  const channels = [16, 8, 0].map((shift) =>
    Math.round(
      ((a >> shift) & 255) * (1 - amount) + ((b >> shift) & 255) * amount,
    ),
  )
  return `rgb(${channels.join(' ')})`
}

export function alpha(hex: string, opacity: number): string {
  const value = Number.parseInt(hex.slice(1), 16)
  return `rgb(${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255} / ${opacity})`
}

export const ease = (value: number): number => 1 - Math.pow(1 - value, 3)
export const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value))

export function align(value: number, ratio: number): number {
  return Math.round(value * ratio) / ratio
}

export function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath()
  context.roundRect(x, y, width, height, Math.min(radius, width / 2, height / 2))
}
