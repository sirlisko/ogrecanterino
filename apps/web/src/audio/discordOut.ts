const MIME = 'audio/webm;codecs=opus'
const CHUNK_MS = 100

export function canStreamToDiscord() {
  return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(MIME)
}

/**
 * Records the mixer's output as WebM/Opus and ships it over a WebSocket to the bot,
 * which forwards the Opus frames to the voice channel without re-encoding.
 */
export class DiscordStreamer {
  private recorder: MediaRecorder | null = null
  private socket: WebSocket | null = null

  constructor(
    private onStatus: (status: 'streaming' | 'stopped' | 'error', message?: string) => void,
  ) {}

  start(stream: MediaStream) {
    this.stop()
    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/discord/stream`
    const socket = new WebSocket(url)
    socket.binaryType = 'arraybuffer'
    this.socket = socket
    socket.onopen = () => {
      const recorder = new MediaRecorder(stream, { mimeType: MIME, audioBitsPerSecond: 128_000 })
      recorder.ondataavailable = async (e) => {
        if (e.data.size && socket.readyState === WebSocket.OPEN)
          socket.send(await e.data.arrayBuffer())
      }
      recorder.start(CHUNK_MS)
      this.recorder = recorder
      this.onStatus('streaming')
    }
    socket.onclose = (e) => {
      if (this.socket !== socket) return
      this.stopRecorder()
      this.socket = null
      this.onStatus(e.code === 1000 ? 'stopped' : 'error', e.reason || undefined)
    }
  }

  stop() {
    this.stopRecorder()
    const socket = this.socket
    this.socket = null
    socket?.close(1000)
    this.onStatus('stopped')
  }

  private stopRecorder() {
    if (this.recorder?.state === 'recording') this.recorder.stop()
    this.recorder = null
  }
}
