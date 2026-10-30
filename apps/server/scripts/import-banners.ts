import { randomBytes } from 'node:crypto'
import { copyFile, mkdir, readdir, rm } from 'node:fs/promises'
import { extname, join, parse } from 'node:path'
import { and, eq } from 'drizzle-orm'
import { config } from '../src/config.ts'
import { openDb } from '../src/db/client.ts'
import { scenes } from '../src/db/schema.ts'
import { ensureSystemUser } from '../src/db/systemUser.ts'

const BANNER_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])

// Images are named after the template scene they belong to, e.g. "Quiet Meadows.jpg".
// GMs' own scenes are never touched, and existing banners are kept unless --force is passed.
const [dir] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const force = process.argv.includes('--force')
if (!dir) {
  console.error('usage: import-banners <dir-of-images> [--force]')
  process.exit(1)
}

const db = openDb(config.dbPath)
const owner = ensureSystemUser(db)
await mkdir(config.bannerDir, { recursive: true })
let applied = 0
for (const file of await readdir(dir)) {
  const ext = extname(file).toLowerCase()
  if (!BANNER_EXTS.has(ext)) continue
  const name = parse(file).name
  const row = db
    .select()
    .from(scenes)
    .where(and(eq(scenes.ownerId, owner), eq(scenes.name, name)))
    .get()
  if (!row) {
    console.warn(`  no template scene named "${name}"`)
    continue
  }
  if (row.bannerPath && !force) continue
  const filename = `${row.id}_${randomBytes(4).toString('hex')}${ext}`
  await copyFile(join(dir, file), join(config.bannerDir, filename))
  if (row.bannerPath) await rm(join(config.bannerDir, row.bannerPath), { force: true })
  db.update(scenes).set({ bannerPath: filename }).where(eq(scenes.id, row.id)).run()
  applied++
}
console.log(`Set ${applied} banners in ${config.bannerDir}`)
