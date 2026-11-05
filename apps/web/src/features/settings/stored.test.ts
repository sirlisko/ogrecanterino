import { describe, expect, it } from 'vitest'
import { withChoice, withSaved } from './stored.ts'

const defaults = { lights: false, fade: 1.5 }

describe('withSaved', () => {
  it('uses the defaults when nothing is saved', () => {
    expect(withSaved(defaults, null)).toEqual(defaults)
  })

  it('applies saved choices over the defaults', () => {
    expect(withSaved(defaults, '{"fade":3}')).toEqual({ lights: false, fade: 3 })
  })

  it('ignores mistyped and unknown choices', () => {
    expect(withSaved(defaults, '{"lights":"yes","fade":3,"old":1}')).toEqual({
      lights: false,
      fade: 3,
    })
  })

  it('survives storage that is not an object', () => {
    expect(withSaved(defaults, 'not json')).toEqual(defaults)
    expect(withSaved(defaults, 'null')).toEqual(defaults)
    expect(withSaved(defaults, '"text"')).toEqual(defaults)
  })
})

describe('withChoice', () => {
  it('saves only what changed', () => {
    expect(JSON.parse(withChoice(null, { fade: 3 }))).toEqual({ fade: 3 })
  })

  it('keeps earlier choices', () => {
    expect(JSON.parse(withChoice('{"lights":true}', { fade: 3 }))).toEqual({
      lights: true,
      fade: 3,
    })
  })
})
