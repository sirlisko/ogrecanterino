export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const s = Math.floor(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** "Next in 28 s, every 15 s–1 min", or just "Every 15 s–1 min" when it isn't waiting. */
export function formatNext(range: readonly [number, number], nextAt: number | null, now: number) {
  const every = `every ${formatRange(range)}`
  if (nextAt === null) return every[0]?.toUpperCase() + every.slice(1)
  return `Next in ${Math.max(0, Math.ceil((nextAt - now) / 1000))} s, ${every}`
}

export function formatRange([min, max]: readonly [number, number]) {
  const fmt = (ms: number) =>
    ms >= 60_000 ? `${+(ms / 60_000).toFixed(1)} min` : `${Math.round(ms / 1000)} s`
  if (min === max) return fmt(min)
  const [a, b] = [fmt(min), fmt(max)]
  const unit = (x: string) => x.split(' ')[1]
  return unit(a) === unit(b) ? `${a.split(' ')[0]}–${b}` : `${a}–${b}`
}
