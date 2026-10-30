/** Maps a 0–100 UI volume to gain on a squared curve, which tracks perceived loudness better than linear. */
export function toGain(volume: number): number {
  const v = Math.max(0, Math.min(100, volume)) / 100
  return v * v
}

export function rampTo(param: AudioParam, value: number, seconds: number, ctx: BaseAudioContext) {
  const now = ctx.currentTime
  param.cancelScheduledValues(now)
  param.setValueAtTime(param.value, now)
  if (seconds <= 0) param.setValueAtTime(value, now)
  else param.linearRampToValueAtTime(value, now + seconds)
}
