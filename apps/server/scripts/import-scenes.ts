import { readFile } from 'node:fs/promises'
import { config } from '../src/config.ts'
import { openDb } from '../src/db/client.ts'
import { ensureSystemUser } from '../src/db/systemUser.ts'
import { importBardicScenes } from '../src/scenes/importBardic.ts'

const [jsonPath] = process.argv.slice(2)
if (!jsonPath) {
  console.error('usage: import-scenes <scenes.json>')
  process.exit(1)
}

const rows: unknown = JSON.parse(await readFile(jsonPath, 'utf8'))
if (!Array.isArray(rows)) throw new Error('Expected an array of exported scenes')

const db = openDb(config.dbPath)
const report = importBardicScenes(db, rows, ensureSystemUser(db))
console.log(`Imported ${report.imported.length} scenes`)
for (const m of report.missing) console.warn(`  ${m.scene}: missing ${m.files.join(', ')}`)
