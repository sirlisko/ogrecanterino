import type { Sound } from '@ogre/shared'
import type { sounds } from '../db/schema.ts'

type Row = typeof sounds.$inferSelect

export function toSound({ createdAt: _, ...row }: Row): Sound {
  return row
}
