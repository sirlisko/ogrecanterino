import { describe, expect, it } from 'vitest'
import {
  createOpusRepacketizer,
  frameSamples,
  joinOpusFrames,
  splitOpusPacket,
} from './opusSplit.ts'

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

const CELT_FB_2_5MS = 28 << 3

function repack(packets: Buffer[]): Promise<Buffer[]> {
  const out: Buffer[] = []
  const stream = createOpusRepacketizer()
  stream.on('data', (p: Buffer) => out.push(p))
  return new Promise((resolve) => {
    stream.on('end', () => resolve(out))
    for (const p of packets) stream.write(p)
    stream.end()
  })
}

describe('frameSamples', () => {
  it('reads frame durations from the TOC config', () => {
    expect(frameSamples(CELT_FB_2_5MS)).toBe(120)
    expect(frameSamples(CELT_FB_20MS)).toBe(960)
    expect(frameSamples(3 << 3)).toBe(2880)
    expect(frameSamples(14 << 3)).toBe(480)
  })
})

describe('joinOpusFrames', () => {
  it('round-trips through splitOpusPacket, including two-byte frame lengths', () => {
    const frames = [
      bytes(CELT_FB_2_5MS, 1),
      Buffer.concat([bytes(CELT_FB_2_5MS), Buffer.alloc(300, 7)]),
      bytes(CELT_FB_2_5MS, 3, 3),
    ]
    expect(splitOpusPacket(joinOpusFrames(frames))).toEqual(frames)
  })
})

describe('createOpusRepacketizer', () => {
  it('joins eight 2.5 ms frames like WebKit emits into one 20 ms packet', async () => {
    const frames = Array.from({ length: 16 }, (_, i) => bytes(CELT_FB_2_5MS, i))
    const out = await repack(frames)
    expect(out).toHaveLength(2)
    expect(out.map((p) => splitOpusPacket(p))).toEqual([frames.slice(0, 8), frames.slice(8)])
  })

  it('splits 60 ms packets like Chromium emits into 20 ms ones', async () => {
    const out = await repack([bytes(CELT_FB_20MS | 0x04 | 3, 3, 1, 1, 2, 2, 3, 3)])
    expect(out).toEqual([
      bytes(CELT_FB_20MS | 0x04, 1, 1),
      bytes(CELT_FB_20MS | 0x04, 2, 2),
      bytes(CELT_FB_20MS | 0x04, 3, 3),
    ])
  })

  it('flushes a partial group when the frame config changes', async () => {
    const out = await repack([bytes(CELT_FB_2_5MS, 1), bytes(CELT_FB_20MS, 2)])
    expect(out).toEqual([bytes(CELT_FB_2_5MS, 1), bytes(CELT_FB_20MS, 2)])
  })
})
