import { Duplex } from 'node:stream'

/**
 * Object-mode passthrough that never applies backpressure: once more than `maxFrames`
 * packets are queued, the oldest are dropped. The voice player consumes exactly one frame
 * per 20 ms tick, so without this any backlog (startup, network bursts, clock drift)
 * would become permanent latency.
 */
export function createLiveBuffer(maxFrames: number) {
  const queue: Buffer[] = []
  let wantsData = false
  let ended = false

  const flush = () => {
    while (wantsData && queue.length) wantsData = stream.push(queue.shift())
    if (ended && !queue.length) stream.push(null)
  }

  const stream = new Duplex({
    objectMode: true,
    readableHighWaterMark: 1,
    write(packet: Buffer, _enc, done) {
      queue.push(packet)
      if (queue.length > maxFrames) queue.splice(0, queue.length - maxFrames)
      flush()
      done()
    },
    final(done) {
      ended = true
      flush()
      done()
    },
    read() {
      wantsData = true
      flush()
    },
  })
  return stream
}
