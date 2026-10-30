import { constants } from 'node:fs'
import { copyFile, mkdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { sql } from 'drizzle-orm'
import type { Db } from '../db/client.ts'
import { sounds } from '../db/schema.ts'
import type { LibraryEntry } from './csv.ts'
import { audioMime, mapLimit, probeDurationMs } from './media.ts'

export interface ImportReport {
  imported: number
  skipped: { filename: string; reason: string }[]
}

export async function importLibrary(
  db: Db,
  entries: LibraryEntry[],
  opts: { sourceDir: string; audioDir: string },
): Promise<ImportReport> {
  await mkdir(opts.audioDir, { recursive: true })
  const skipped: ImportReport['skipped'] = []

  const rows = await mapLimit(entries, 8, async (entry) => {
    const mime = audioMime(entry.filename)
    if (!mime) return void skipped.push({ filename: entry.filename, reason: 'not audio' })
    const source = join(opts.sourceDir, entry.filename)
    const info = await stat(source).catch(() => null)
    if (!info) return void skipped.push({ filename: entry.filename, reason: 'file not found' })
    const target = join(opts.audioDir, entry.filename)
    // FICLONE makes this a free copy-on-write clone on APFS/btrfs; elsewhere it's a normal copy.
    if (!(await stat(target).catch(() => null)))
      await copyFile(source, target, constants.COPYFILE_FICLONE)
    return { ...entry, mime, size: info.size, durationMs: await probeDurationMs(target) }
  })

  const valid = rows.filter((r) => r !== undefined)
  db.transaction((tx) => {
    for (const r of valid) {
      tx.insert(sounds)
        .values(r)
        .onConflictDoUpdate({
          target: sounds.filename,
          set: {
            title: sql`excluded.title`,
            artist: sql`excluded.artist`,
            tags: sql`excluded.tags`,
            category: sql`excluded.category`,
            size: sql`excluded.size`,
            durationMs: sql`excluded.duration_ms`,
          },
        })
        .run()
    }
  })
  return { imported: valid.length, skipped }
}
