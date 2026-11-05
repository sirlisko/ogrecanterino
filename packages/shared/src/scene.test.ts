import { describe, expect, it } from 'vitest'
import { emptySceneData, sceneData } from './scene.ts'

describe('sceneData art', () => {
  it('keeps a chosen illustration and leaves it out when none is chosen', () => {
    expect(sceneData.parse({ ...emptySceneData(), art: 'crypt' }).art).toBe('crypt')
    expect('art' in emptySceneData()).toBe(false)
  })

  it('rejects an illustration that does not exist', () => {
    expect(sceneData.safeParse({ ...emptySceneData(), art: 'spaceship' }).success).toBe(false)
  })
})
