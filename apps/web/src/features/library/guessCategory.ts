import type { SoundCategory } from '@ogre/shared'

const MUSIC = /\b(music|theme|song|track|ost|battle|boss)\b/i
const AMBIENCE = /\b(ambien(ce|t)|atmos(phere)?|loop|background|bg)\b/i

/** A starting point for the uploader to correct: names win, then length decides. */
export function guessCategory(filename: string, durationMs: number | null): SoundCategory {
  const name = filename.replace(/[_-]+/g, ' ')
  if (MUSIC.test(name)) return 'music'
  if (AMBIENCE.test(name)) return 'ambience'
  if (durationMs === null) return 'effect'
  if (durationMs < 20_000) return 'effect'
  if (durationMs > 120_000) return 'music'
  return 'ambience'
}

export function titleFromFilename(filename: string) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
}

export function readDurationMs(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    const done = (ms: number | null) => {
      URL.revokeObjectURL(url)
      resolve(ms)
    }
    audio.onloadedmetadata = () =>
      done(Number.isFinite(audio.duration) ? Math.round(audio.duration * 1000) : null)
    audio.onerror = () => done(null)
    audio.preload = 'metadata'
    audio.src = url
  })
}
