export type Rng = () => number
export type Range = readonly [number, number]

export function randomInRange([min, max]: Range, rng: Rng = Math.random): number {
  return min + rng() * (Math.max(min, max) - min)
}

export function randomIntInRange([min, max]: Range, rng: Rng = Math.random): number {
  const hi = Math.max(min, max)
  return Math.min(hi, min + Math.floor(rng() * (hi - min + 1)))
}

export type PlaylistMode = 'sequential' | 'shuffle' | 'repeat-one'

/** Picks the track after `current`; shuffle never repeats the same track back to back. */
export function nextTrackIndex(
  current: number,
  length: number,
  mode: PlaylistMode,
  rng: Rng = Math.random,
): number {
  if (length <= 0) return -1
  if (mode === 'repeat-one') return Math.max(0, current)
  if (mode === 'sequential' || length === 1) return (current + 1) % length
  const pick = Math.floor(rng() * (length - 1))
  return pick >= current ? pick + 1 : pick
}

export function previousTrackIndex(current: number, length: number): number {
  return length <= 0 ? -1 : (current - 1 + length) % length
}
