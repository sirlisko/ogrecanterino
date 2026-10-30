import { useEffect } from 'react'
import { useRecordPlay } from '../../api/me.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'

export function usePreview() {
  const playing = usePlayer((s) => s.previewId)
  const record = useRecordPlay()

  useEffect(() => () => engine.stopPreview(), [])

  const toggle = (soundId: string) => {
    if (playing !== soundId) record.mutate(soundId)
    engine.togglePreview(soundId)
  }

  return { playing, toggle }
}
