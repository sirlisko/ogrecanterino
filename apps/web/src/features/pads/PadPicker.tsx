import { SoundPicker } from '../library/SoundPicker.tsx'

export function PadPicker({
  slot,
  onPick,
  onClose,
}: {
  slot: number
  onPick: (soundId: string, label: string) => void
  onClose: () => void
}) {
  return (
    <SoundPicker
      title={`Choose a sound for pad ${slot}`}
      category="effect"
      onPick={(sound) => onPick(sound.id, sound.title)}
      onClose={onClose}
    />
  )
}
