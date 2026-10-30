import { parse } from 'csv-parse/sync'
import { categoryFromTags } from '@ogre/shared'
import { z } from 'zod'

const row = z.object({
  Title: z.string(),
  By: z.string(),
  Tags: z.string(),
  Filename: z.string(),
})

export interface LibraryEntry {
  title: string
  artist: string
  tags: string[]
  filename: string
  category: ReturnType<typeof categoryFromTags>
}

export function parseLibraryCsv(text: string): LibraryEntry[] {
  const records: unknown[] = parse(text, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true,
  })
  return records.map((r) => {
    const { Title, By, Tags, Filename } = row.parse(r)
    const tags = Tags.split(';')
      .map((t) => t.trim())
      .filter(Boolean)
    return { title: Title, artist: By, tags, filename: Filename, category: categoryFromTags(tags) }
  })
}
