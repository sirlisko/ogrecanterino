import { execFile } from 'node:child_process'
import { extname } from 'node:path'
import { promisify } from 'node:util'
import type { SoundCategory } from '@ogre/shared'

const run = promisify(execFile)

const MIME_BY_EXT: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.webm': 'audio/webm',
}

export function audioMime(filename: string): string | null {
  return MIME_BY_EXT[extname(filename).toLowerCase()] ?? null
}

/** Returns null when ffprobe is unavailable or the file isn't decodable audio. */
export async function probeDurationMs(path: string): Promise<number | null> {
  try {
    const { stdout } = await run('ffprobe', [
      '-v',
      'error',
      '-select_streams',
      'a:0',
      '-show_entries',
      'format=duration',
      '-of',
      'csv=p=0',
      path,
    ])
    const seconds = Number.parseFloat(stdout.trim())
    return Number.isFinite(seconds) ? Math.round(seconds * 1000) : null
  } catch {
    return null
  }
}

/**
 * Integrated loudness each category is trimmed towards: the library's average for that category
 * when levelling was added, so it evens sounds out without shifting the balance scenes were mixed
 * with (ambience sits about 10 LU under music).
 */
const TARGET_LUFS: Record<SoundCategory, number> = { music: -14, ambience: -25, effect: -20 }
/** Headroom kept under full scale when a quiet sound is boosted. */
const PEAK_CEILING_DB = -1
const MAX_BOOST_DB = 12
const MAX_CUT_DB = -24
/** ebur128 reports this for silence or clips too short to gate. */
const UNMEASURABLE_LUFS = -70

/**
 * Gain in dB that brings a file to its category's target without pushing its peak past the ceiling.
 * Null when ffmpeg is unavailable or the sound is too short or quiet to measure.
 */
export async function measureGainDb(path: string, category: SoundCategory): Promise<number | null> {
  try {
    const { stderr } = await run(
      'ffmpeg',
      [
        '-hide_banner',
        '-nostats',
        '-i',
        path,
        '-af',
        'ebur128=peak=sample:framelog=quiet',
        '-f',
        'null',
        '-',
      ],
      { maxBuffer: 16 * 1024 * 1024 },
    )
    // The summary comes last; earlier lines may repeat the same labels.
    const summary = stderr.slice(stderr.lastIndexOf('Summary:'))
    const integrated = Number.parseFloat(summary.match(/I:\s+(-?[\d.]+) LUFS/)?.[1] ?? '')
    const peak = Number.parseFloat(summary.match(/Peak:\s+(-?[\d.]+|-inf) dBFS/)?.[1] ?? '')
    if (!Number.isFinite(integrated) || integrated <= UNMEASURABLE_LUFS) return null
    const headroom = Number.isFinite(peak) ? PEAK_CEILING_DB - peak : MAX_BOOST_DB
    const gain = Math.min(TARGET_LUFS[category] - integrated, headroom, MAX_BOOST_DB)
    return Math.round(Math.max(MAX_CUT_DB, gain) * 10) / 10
  } catch {
    return null
  }
}

export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i] as T)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}
