import { execFile } from 'node:child_process'
import { extname } from 'node:path'
import { promisify } from 'node:util'

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
