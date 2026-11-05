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

  it('draws the same scene the same way, and different scenes differently', () => {
    const a = () => drawScene('forest', seededRandom(hashText('scene-a')), 320)
    const b = drawScene('forest', seededRandom(hashText('scene-b')), 320)
    expect(a()).toEqual(a())
    expect(b.far).not.toEqual(a().far)
  })
})
