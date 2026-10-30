import { useState } from 'react'

const ACCEPT = '.mp3,.ogg,.oga,.opus,.wav,.flac,.m4a,.webm,audio/*'
const AUDIO_EXT = /\.(mp3|ogg|oga|opus|wav|flac|m4a|webm)$/i

// Some systems report an empty type for less common formats, so check the extension too.
const isAudio = (f: File) => f.type.startsWith('audio/') || AUDIO_EXT.test(f.name)

export function DropZone({
  onFiles,
  disabled,
}: {
  onFiles: (files: File[]) => void
  disabled?: boolean
}) {
  const [over, setOver] = useState(false)
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        if (!disabled) onFiles([...e.dataTransfer.files].filter(isAudio))
      }}
      className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${over ? 'border-brass bg-brass/10' : 'border-peat-600 hover:border-peat-400'}`}
    >
      <span>Drop audio files here, or choose them</span>
      <span className="text-sm text-peat-400">MP3, OGG, WAV, FLAC or M4A, up to 100 MB each.</span>
      <input
        type="file"
        accept={ACCEPT}
        multiple
        disabled={disabled}
        onChange={(e) => {
          onFiles([...(e.target.files ?? [])])
          e.target.value = ''
        }}
        className="sr-only"
      />
    </label>
  )
}
