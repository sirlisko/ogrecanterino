import { readFile } from 'node:fs/promises'
import { config } from '../src/config.ts'
import { openDb } from '../src/db/client.ts'
import { parseLibraryCsv } from '../src/library/csv.ts'
import { importLibrary } from '../src/library/import.ts'

const [csvPath, sourceDir] = process.argv.slice(2)
if (!csvPath || !sourceDir) {
  console.error('usage: import-library <sounds.csv> <source-audio-dir>')
  process.exit(1)
}

const entries = parseLibraryCsv(await readFile(csvPath, 'utf8'))
const report = await importLibrary(openDb(config.dbPath), entries, {
  sourceDir,
  audioDir: config.audioDir,
})
console.log(`Imported ${report.imported} sounds into ${config.audioDir}`)
for (const s of report.skipped) console.warn(`  skipped ${s.filename}: ${s.reason}`)
