export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const s = Math.floor(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function formatRange([min, max]: readonly [number, number]) {
  const fmt = (ms: number) =>
    ms >= 60_000 ? `${+(ms / 60_000).toFixed(1)} min` : `${Math.round(ms / 1000)} s`
  if (min === max) return fmt(min)
  const [a, b] = [fmt(min), fmt(max)]
  const unit = (x: string) => x.split(' ')[1]
  return unit(a) === unit(b) ? `${a.split(' ')[0]}–${b}` : `${a}–${b}`
}
