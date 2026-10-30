const MAX_BYTES = 400 * 1024 * 1024

/** LRU cache of decoded audio, bounded by decoded PCM size rather than entry count. */
export class BufferCache {
  private entries = new Map<string, Promise<AudioBuffer>>()
  private sizes = new Map<string, number>()
  private total = 0

  constructor(private ctx: BaseAudioContext) {}

  get(url: string): Promise<AudioBuffer> {
    const hit = this.entries.get(url)
    if (hit) {
      this.entries.delete(url)
      this.entries.set(url, hit)
      return hit
    }
    const pending = this.load(url)
    this.entries.set(url, pending)
    pending.catch(() => this.entries.delete(url))
    return pending
  }

  private async load(url: string) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`)
    const buffer = await this.ctx.decodeAudioData(await res.arrayBuffer())
    const bytes = buffer.length * buffer.numberOfChannels * 4
    this.sizes.set(url, bytes)
    this.total += bytes
    this.evict(url)
    return buffer
  }

  private evict(keep: string) {
    for (const url of this.entries.keys()) {
      if (this.total <= MAX_BYTES) return
      if (url === keep) continue
      this.total -= this.sizes.get(url) ?? 0
      this.sizes.delete(url)
      this.entries.delete(url)
    }
  }
}
