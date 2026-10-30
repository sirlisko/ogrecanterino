import { randomBytes } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, rm, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { MultipartFile } from '@fastify/multipart'
import type { SoundCategory } from '@ogre/shared'
import { audioMime, measureGainDb, probeDurationMs } from '../library/media.ts'
import { httpError } from '../http/auth.ts'

function slugify(name: string) {
  return (
    name
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_')
      .slice(0, 60) || 'sound'
  )
}

/** Stores an uploaded audio file under a unique name and verifies ffprobe can read it. */
export async function storeAudioUpload(
  file: MultipartFile,
  audioDir: string,
  category: SoundCategory,
) {
  const ext = extname(file.filename).toLowerCase()
  const mime = audioMime(file.filename)
  if (!mime) throw httpError(415, `Unsupported file type ${ext || '(none)'}`)
  await mkdir(audioDir, { recursive: true })
  const filename = `${slugify(file.filename.replace(/\.[^.]+$/, ''))}_${randomBytes(5).toString('hex')}${ext}`
  const path = join(audioDir, filename)
  await pipeline(file.file, createWriteStream(path))
  if (file.file.truncated) {
    await rm(path)
    throw httpError(413, 'File too large')
  }
  const durationMs = await probeDurationMs(path)
  if (durationMs === null) {
    await rm(path)
    throw httpError(422, 'Could not read audio from the file')
  }
  return {
    filename,
    mime,
    size: (await stat(path)).size,
    durationMs,
    gainDb: await measureGainDb(path, category),
  }
}
