import { describe, expect, it } from 'vitest'
import { splitOpusPacket } from './opusSplit.ts'

const CELT_FB_20MS = 31 << 3
const bytes = (...b: number[]) => Buffer.from(b)

describe('splitOpusPacket', () => {
  it('leaves single-frame packets alone', () => {
    const p = bytes(CELT_FB_20MS, 1, 2, 3)
    expect(splitOpusPacket(p)).toEqual([p])
  })

  it('splits two equal frames (code 1)', () => {
    expect(splitOpusPacket(bytes(CELT_FB_20MS | 1, 1, 2, 3, 4))).toEqual([
      bytes(CELT_FB_20MS, 1, 2),
      bytes(CELT_FB_20MS, 3, 4),
    ])
  })

  it('splits two sized frames (code 2)', () => {
    expect(splitOpusPacket(bytes(CELT_FB_20MS | 2, 1, 9, 7, 8))).toEqual([
      bytes(CELT_FB_20MS, 9),
      bytes(CELT_FB_20MS, 7, 8),
    ])
  })

  it('splits constant-bitrate code 3 packets like browsers emit', () => {
    const p = bytes(CELT_FB_20MS | 0x04 | 3, 3, 1, 1, 2, 2, 3, 3)
    expect(splitOpusPacket(p)).toEqual([
      bytes(CELT_FB_20MS | 0x04, 1, 1),
      bytes(CELT_FB_20MS | 0x04, 2, 2),
      bytes(CELT_FB_20MS | 0x04, 3, 3),
    ])
  })

  it('splits variable-bitrate code 3 packets with padding', () => {
    // VBR + padding flag, 3 frames; 2 bytes padding; lengths 1 and 2; last frame gets the rest.
    const p = bytes(CELT_FB_20MS | 3, 0xc3, 2, 1, 2, 0xa, 0xb, 0xb, 0xc, 0xc, 0xc, 0, 0)
    expect(splitOpusPacket(p)).toEqual([
      bytes(CELT_FB_20MS, 0xa),
      bytes(CELT_FB_20MS, 0xb, 0xb),
      bytes(CELT_FB_20MS, 0xc, 0xc, 0xc),
    ])
  })
})
