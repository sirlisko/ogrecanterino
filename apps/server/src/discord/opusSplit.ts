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

const FRAME_SAMPLES = 960

/** Samples per frame at 48 kHz, from the TOC's config number (RFC 6716 §3.1). */
export function frameSamples(toc: number): number {
  const config = toc >> 3
  if (config < 12) return [480, 960, 1920, 2880][config % 4] as number
  if (config < 16) return [480, 960][config % 2] as number
  return [120, 240, 480, 960][config % 4] as number
}

function frameLength(length: number): number[] {
  if (length < 252) return [length]
  const first = 252 + (length & 3)
  return [first, (length - first) >> 2]
}

/** Joins single-frame packets sharing one TOC into a variable-bitrate code 3 packet (RFC 6716 §3.2.5). */
export function joinOpusFrames(frames: Buffer[]): Buffer {
  if (frames.length === 1) return frames[0] as Buffer
  const data = frames.map((f) => f.subarray(1))
  const lengths = data.slice(0, -1).flatMap((d) => frameLength(d.length))
  const toc = ((frames[0] as Buffer)[0] as number) | 3
  return Buffer.concat([Buffer.from([toc, 0x80 | frames.length, ...lengths]), ...data])
}

/**
 * Re-packs browser Opus into the 20 ms packets Discord's player sends one per tick. Chromium
 * emits 60 ms packets that get split; WebKit (Safari, every iOS browser) emits 2.5 ms frames
 * that get joined eight at a time. Without the join, Discord heard 2.5 ms out of every 20.
 */
export function createOpusRepacketizer() {
  let group: Buffer[] = []
  let samples = 0
  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(packet: Buffer, _enc, done) {
      for (const frame of splitOpusPacket(packet)) {
        const toc = frame[0] as number
        // A frame that can't extend the current group (new config, or it would overrun 20 ms)
        // flushes it early: a short packet beats dropping audio.
        if (
          group.length &&
          (toc !== group[0]?.[0] || samples + frameSamples(toc) > FRAME_SAMPLES)
        ) {
          this.push(joinOpusFrames(group))
          group = []
          samples = 0
        }
        group.push(frame)
        samples += frameSamples(toc)
        if (samples >= FRAME_SAMPLES) {
          this.push(joinOpusFrames(group))
          group = []
          samples = 0
        }
      }
      done()
    },
  })
}
