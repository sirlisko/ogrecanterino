import { describe, expect, it } from 'vitest'
import { convertBardicScene, createResolver, filenameStem } from './bardic.ts'
import { sceneData } from './scene.ts'

const card = (id: string, file: string, repeat: unknown = null, volume = 80) => ({
  id,
  name: `🔥${id}`,
  sound: { name: id, datapath: `/api/files/x/y/${file}` },
  kind: 'x',
  playSettings: { enabled: true, volume, repeat },
})

const every = (from: number, to: number, times: [number, number] = [1, 1]) => ({
  times: { from: times[0], to: times[1] },
  every: { from: { ms: from }, to: { ms: to } },
})

const row = {
  Name: 'Test Scene ',
  Tags: [{ Name: 'Ghost' }, { Name: 'Dark' }, { Name: 'Ghost' }],
  Data: JSON.stringify({
    name: 'Test Scene',
    settings: {
      values: {
        isMusicAPlaylist: { id: 'x', value: true },
        musicCrossfadeEnabled: { id: 'x', value: false },
        startMusicWhenStartingScene: { id: 'x', value: true },
      },
    },
    globalVolume: 90,
    music: { cards: [card('m1', 'song_AbCdE12345.mp3', every(0, 0))] },
    ambiences: {
      cards: [
        card('a1', 'rain_ab12cd34ef.wav', every(0, 0)),
        card('a2', 'crow_zz99yy88xx.ogg', every(20000, 45000, [1, 3])),
        card('a3', 'cave_ambience_e75cpfie3o.wav', every(0, 0)),
      ],
    },
    effects: { cards: [card('e1', 'gone_qq11ww22ee.wav', null, 140)] },
  }),
}

const resolve = createResolver([
  ['song_AbCdE12345.mp3', 's-song'],
  ['rain_ab12cd34ef.wav', 's-rain'],
  ['crow_zz99yy88xx.ogg', 's-crow'],
  ['cave_ambience_e75cpfie3o_mgfxswn7kf.ogg', 's-cave'],
])

describe('filenameStem', () => {
  it('strips extension and id suffix', () => {
    expect(filenameStem('adventure_beyond_4N8NXMJ84L.mp3')).toBe('adventure_beyond')
  })

  it('keeps ten-letter words without digits', () => {
    expect(filenameStem('celtic_atmosphere.mp3')).toBe('celtic_atmosphere')
  })
})

describe('convertBardicScene', () => {
  const result = convertBardicScene(row, resolve)

  it('maps scene metadata and settings', () => {
    expect(result.name).toBe('Test Scene')
    expect(result.tags).toEqual(['Ghost', 'Dark'])
    expect(result.data.globalVolume).toBe(90)
    expect(result.data.settings).toMatchObject({ musicIsPlaylist: true, musicCrossfade: false })
  })

  it('maps repeat settings to card modes', () => {
    const [rain, crow] = result.data.ambiences
    expect(result.data.music[0]?.mode).toBe('loop')
    expect(rain?.mode).toBe('loop')
    expect(crow).toMatchObject({ mode: 'interval', intervalMs: [20000, 45000], times: [1, 3] })
    expect(result.data.effects[0]?.mode).toBe('oneshot')
  })

  it('resolves renamed files through the stem fallback', () => {
    expect(result.data.ambiences[2]?.soundId).toBe('s-cave')
  })

  it('keeps unresolved cards and reports them', () => {
    expect(result.data.effects[0]).toMatchObject({
      soundId: null,
      missingRef: 'gone_qq11ww22ee.wav',
    })
    expect(result.missing).toEqual(['gone_qq11ww22ee.wav'])
  })

  it('clamps volume and produces valid scene data', () => {
    expect(result.data.effects[0]?.volume).toBe(100)
    expect(() => sceneData.parse(result.data)).not.toThrow()
  })
})
