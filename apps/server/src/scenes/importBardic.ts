import { convertBardicScene, createResolver } from '@ogre/shared'
import { and, eq } from 'drizzle-orm'
import type { Db } from '../db/client.ts'
import { scenes, sounds } from '../db/schema.ts'

export interface SceneImportReport {
  imported: string[]
  missing: { scene: string; files: string[] }[]
}

export function importBardicScenes(db: Db, rows: unknown[], ownerId: string): SceneImportReport {
  const library = db.select({ filename: sounds.filename, id: sounds.id }).from(sounds).all()
  const resolve = createResolver(library.map((s) => [s.filename, s.id]))
  const report: SceneImportReport = { imported: [], missing: [] }

  db.transaction((tx) => {
    for (const row of rows) {
      const scene = convertBardicScene(row, resolve)
      const values = {
        ownerId,
        name: scene.name,
        tags: scene.tags,
        visibility: 'group' as const,
        data: scene.data,
        updatedAt: new Date().toISOString(),
      }
      const existing = tx
        .select({ id: scenes.id })
        .from(scenes)
        .where(and(eq(scenes.ownerId, ownerId), eq(scenes.name, scene.name)))
        .get()
      if (existing) tx.update(scenes).set(values).where(eq(scenes.id, existing.id)).run()
      else tx.insert(scenes).values(values).run()
      report.imported.push(scene.name)
      if (scene.missing.length) report.missing.push({ scene: scene.name, files: scene.missing })
    }
  })
  return report
}
