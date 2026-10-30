import { describe, expect, it } from 'vitest'
import { parseLibraryCsv } from './csv.ts'

describe('parseLibraryCsv', () => {
  it('parses quoted titles, BOM and tag lists', () => {
    const csv =
      '﻿Title,By,Tags,Filename,File Type,Size (bytes)\n' +
      '"Bye, Bye Brain!",Alexander Nakarada,Music; Funny; Uplifting,bye_ZMR7FqHn9p.mp3,audio/mpeg,1\n' +
      'Thunder,RPG Audio Vault,Sound Effect; Storm,thunder_9m0uqvssyp.wav,audio/wav,2\n'
    expect(parseLibraryCsv(csv)).toEqual([
      {
        title: 'Bye, Bye Brain!',
        artist: 'Alexander Nakarada',
        tags: ['Music', 'Funny', 'Uplifting'],
        filename: 'bye_ZMR7FqHn9p.mp3',
        category: 'music',
      },
      {
        title: 'Thunder',
        artist: 'RPG Audio Vault',
        tags: ['Sound Effect', 'Storm'],
        filename: 'thunder_9m0uqvssyp.wav',
        category: 'effect',
      },
    ])
  })
})
