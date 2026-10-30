import { Transform } from 'node:stream'

function readFrameLength(buf: Buffer, offset: number): [length: number, bytesUsed: number] {
  const b0 = buf[offset] ?? 0
  if (b0 < 252) return [b0, 1]
  return [b0 + 4 * (buf[offset + 1] ?? 0), 2]
}

/**
 * Splits a multi-frame Opus packet into single-frame packets (RFC 6716 §3.2) without
 * re-encoding. Browsers' MediaRecorder emits 60 ms packets (3 × 20 ms), but Discord's
 * player sends one packet per 20 ms tick, so each must hold exactly one frame.
 */
export function splitOpusPacket(packet: Buffer): Buffer[] {
  if (packet.length < 1) return []
  const toc = packet[0] as number
  const code = toc & 0x03
  if (code === 0) return [packet]
  const single = toc & 0xfc
  const frame = (data: Buffer) => Buffer.concat([Buffer.from([single]), data])

  if (code === 1) {
    const half = (packet.length - 1) / 2
    return [frame(packet.subarray(1, 1 + half)), frame(packet.subarray(1 + half))]
  }
  if (code === 2) {
    const [len, used] = readFrameLength(packet, 1)
    const start = 1 + used
    return [frame(packet.subarray(start, start + len)), frame(packet.subarray(start + len))]
  }

  const header = packet[1] ?? 0
  const vbr = (header & 0x80) !== 0
  const hasPadding = (header & 0x40) !== 0
  const count = header & 0x3f
  let offset = 2
  let padding = 0
  if (hasPadding) {
    let b: number
    do {
      b = packet[offset++] ?? 0
      padding += b === 255 ? 254 : b
    } while (b === 255)
  }
  const end = packet.length - padding
  const lengths: number[] = []
  if (vbr) {
    for (let i = 0; i < count - 1; i++) {
      const [len, used] = readFrameLength(packet, offset)
      lengths.push(len)
      offset += used
    }
    lengths.push(end - offset - lengths.reduce((a, b) => a + b, 0))
  } else {
    lengths.push(...Array<number>(count).fill((end - offset) / count))
  }
  return lengths.map((len) => {
    const data = packet.subarray(offset, offset + len)
    offset += len
    return frame(data)
  })
}

export function createOpusSplitter() {
  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(packet: Buffer, _enc, done) {
      for (const p of splitOpusPacket(packet)) this.push(p)
      done()
    },
  })
}
