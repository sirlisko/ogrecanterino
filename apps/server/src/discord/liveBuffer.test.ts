import { describe, expect, it } from 'vitest'
import { createLiveBuffer } from './liveBuffer.ts'

const frame = (n: number) => Buffer.from([n])

function drain(stream: ReturnType<typeof createLiveBuffer>) {
  const out: number[] = []
  let packet: Buffer | null
  while ((packet = stream.read() as Buffer | null)) out.push(packet[0] as number)
  return out
}

describe('createLiveBuffer', () => {
  it('passes frames through in order', () => {
    const stream = createLiveBuffer(10)
    for (const n of [1, 2, 3]) stream.write(frame(n))
    expect(drain(stream)).toEqual([1, 2, 3])
  })

  it('drops the oldest frames when the backlog exceeds the limit', () => {
    const stream = createLiveBuffer(3)
    for (let n = 1; n <= 8; n++) stream.write(frame(n))
    expect(drain(stream)).toEqual([6, 7, 8])
  })

  it('never signals backpressure to the writer', () => {
    const stream = createLiveBuffer(3)
    for (let n = 1; n <= 50; n++) expect(stream.write(frame(n))).toBe(true)
  })

  it('ends after the queued frames are read', async () => {
    const stream = createLiveBuffer(10)
    stream.write(frame(1))
    stream.end()
    const out: number[] = []
    for await (const packet of stream) out.push((packet as Buffer)[0] as number)
    expect(out).toEqual([1])
  })
})
