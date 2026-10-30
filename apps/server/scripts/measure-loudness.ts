import { eq, isNull } from 'drizzle-orm'
import { join } from 'node:path'
import { config } from '../src/config.ts'
import { openDb } from '../src/db/client.ts'
import { sounds } from '../src/db/schema.ts'
import { mapLimit, measureGainDb } from '../src/library/media.ts'

// Re-measures everything with --all; by default only sounds that were never measured.
const all = process.argv.includes('--all')
const db = openDb(config.dbPath)
const rows = db
  .select({ id: sounds.id, filename: sounds.filename, category: sounds.category })
  .from(sounds)
  .where(all ? undefined : isNull(sounds.gainDb))
  .all()

let done = 0
let unmeasured = 0
await mapLimit(rows, 4, async ({ id, filename, category }) => {
  const gainDb = await measureGainDb(join(config.audioDir, filename), category)
  if (gainDb === null) unmeasured++
  db.update(sounds).set({ gainDb }).where(eq(sounds.id, id)).run()
  if (++done % 50 === 0) console.log(`${done}/${rows.length}`)
})
console.log(`Measured ${rows.length - unmeasured} of ${rows.length} sounds in ${config.audioDir}`)
if (unmeasured) console.log(`${unmeasured} were too short or quiet to measure and play unchanged`)
