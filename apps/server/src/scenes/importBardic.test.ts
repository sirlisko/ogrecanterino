import { describe, expect, it } from 'vitest'
import { openDb } from '../db/client.ts'
import { scenes, sounds } from '../db/schema.ts'
import { ensureSystemUser } from '../db/systemUser.ts'
import { importBardicScenes } from './importBardic.ts'

const exportRow = (name: string, file: string) => ({
  Name: name,
  Tags: [{ Name: 'Calm' }],
  Data: JSON.stringify({
    name,
    settings: { values: {} },
    ambiences: {
      cards: [
        {
          id: 'c1',
          name: 'Rain',
          sound: { name: 'Rain', datapath: `/api/files/a/b/${file}` },
          playSettings: { enabled: true, volume: 50, repeat: null },
        },
      ],
    },
  }),
})

describe('importBardicScenes', () => {
  it('links cards to library sounds and is idempotent per owner + name', () => {
    const db = openDb(':memory:')
    const soundId = db
      .insert(sounds)
      .values({
        title: 'Rain',
        filename: 'rain_ab12cd34ef.wav',
        mime: 'audio/wav',
        size: 1,
        category: 'ambience',
      })
      .returning()
      .get().id
    const owner = ensureSystemUser(db)

    importBardicScenes(db, [exportRow('Farm', 'rain_ab12cd34ef.wav')], owner)
    const report = importBardicScenes(
      db,
      [exportRow('Farm', 'rain_ab12cd34ef.wav'), exportRow('Lost', 'nope_zz11xx22cc.wav')],
      owner,
    )

    const all = db.select().from(scenes).all()
    expect(all.map((s) => s.name).sort()).toEqual(['Farm', 'Lost'])
    expect(all.find((s) => s.name === 'Farm')?.data.ambiences[0]?.soundId).toBe(soundId)
    expect(all.every((s) => s.visibility === 'group')).toBe(true)
    expect(report.missing).toEqual([{ scene: 'Lost', files: ['nope_zz11xx22cc.wav'] }])
  })
})
