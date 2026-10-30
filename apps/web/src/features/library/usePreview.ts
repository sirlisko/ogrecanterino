import { useEffect, useState } from 'react'
import { useRecordPlay } from '../../api/me.ts'
import { engine } from '../../audio/engine.ts'

export function usePreview() {
  const [playing, setPlaying] = useState<string | null>(null)
  const record = useRecordPlay()

  useEffect(() => () => engine.stopPreview(), [])

  const toggle = (soundId: string) => {
    if (playing === soundId) {
      engine.stopPreview()
      setPlaying(null)
      return
    }
    setPlaying(soundId)
    record.mutate(soundId)
    void engine.preview(soundId).then(() => setPlaying((p) => (p === soundId ? null : p)))
  }

  return { playing, toggle }
}
