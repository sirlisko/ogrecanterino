import { sceneArtKinds } from '@ogre/shared'
import { describe, expect, it } from 'vitest'
import { drawScene } from './compose.ts'
import { hashText, seededRandom } from './random.ts'

const PATH = /^[MLHVQTAZmlhvqtaz0-9 .-]*$/

describe('drawScene', () => {
  it.each(sceneArtKinds)('draws %s as valid path data at both widths', (kind) => {
    for (const width of [320, 720]) {
      const d = drawScene(kind, seededRandom(hashText(kind)), width)
      expect(d.near.length).toBeGreaterThan(0)
      for (const layer of [d.stars, d.orb, d.far, d.detail, d.near, d.lights]) {
        expect(layer).toMatch(PATH)
        expect(layer).not.toContain('NaN')
      }
    }
  })

  const seeds = Array.from({ length: 60 }, (_, i) => seededRandom(hashText(`scene-${i}`)))

  it.each(sceneArtKinds)('keeps the %s sun or moon out of the card corners', (kind) => {
    for (let i = 0; i < 60; i++) {
      const { orb } = drawScene(kind, seededRandom(hashText(`scene-${i}`)), 320)
      const match = /M(-?[\d.]+) -?[\d.]+ a([\d.]+)/.exec(orb)
      if (!match) continue
      const centre = Number(match[1]) + Number(match[2])
      expect(centre).toBeGreaterThanOrEqual(64)
      expect(centre).toBeLessThanOrEqual(256)
    }
  })

  it('draws forests and deserts in more than one style', () => {
    const forests = seeds.map((rand) => drawScene('forest', rand, 320).near)
    expect(forests.some((d) => d.includes(' a'))).toBe(true)
    expect(forests.some((d) => !d.includes(' a'))).toBe(true)
    const deserts = seeds.map((rand) => drawScene('desert', rand, 320).far)
    expect(deserts.some((d) => d.includes('Q'))).toBe(true)
    expect(deserts.some((d) => !d.includes('Q'))).toBe(true)
  })

  it('draws the same scene the same way, and different scenes differently', () => {
    const a = () => drawScene('forest', seededRandom(hashText('scene-a')), 320)
    const b = drawScene('forest', seededRandom(hashText('scene-b')), 320)
    expect(a()).toEqual(a())
    expect(b.far).not.toEqual(a().far)
  })
})
