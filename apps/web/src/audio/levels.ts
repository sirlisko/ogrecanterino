import type { BusName } from './mixer.ts'

export type Levels = Record<BusName, number>

const FLOOR_DB = -60

/** A peak amplitude on a 0–1 dB scale, so quiet layers still register. */
export function toLevel(peak: number): number {
  const db = peak > 0 ? 20 * Math.log10(peak) : FLOOR_DB
  return Math.max(0, Math.min(1, 1 - db / FLOOR_DB))
}

const COLORS: Record<BusName, [number, number, number]> = {
  music: [215, 168, 74],
  ambience: [134, 191, 169],
  effect: [169, 139, 234],
}
/** Effects are short; weighting them up lets a hit tint the light before it's gone. */
const WEIGHT: Levels = { music: 1, ambience: 1, effect: 2.2 }

/** The section colours mixed by how loud each section is, as "r, g, b". */
export function mixColor(levels: Levels): string {
  const buses = Object.keys(COLORS) as BusName[]
  const total = buses.reduce((n, b) => n + levels[b] * WEIGHT[b], 0)
  if (total <= 0) return COLORS.music.join(', ')
  return [0, 1, 2]
    .map((i) =>
      Math.round(
        buses.reduce((n, b) => n + (COLORS[b][i] ?? 0) * levels[b] * WEIGHT[b], 0) / total,
      ),
    )
    .join(', ')
}
