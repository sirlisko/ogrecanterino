import { type FormEvent, useState } from 'react'
import { useUploadSound } from '../../api/sounds.ts'
import { Button } from '../../ui/Button.tsx'
import { Dialog } from '../../ui/Dialog.tsx'
import { type SoundMeta, SoundFields } from './SoundFields.tsx'

const ACCEPT = '.mp3,.ogg,.oga,.opus,.wav,.flac,.m4a,.webm,audio/*'

export function UploadDialog({ onClose }: { onClose: () => void }) {
  const upload = useUploadSound()
  const [file, setFile] = useState<File | null>(null)
  const [meta, setMeta] = useState<SoundMeta>({
    title: '',
    artist: '',
    tags: '',
    category: 'effect',
  })

  const pick = (f: File | undefined) => {
    setFile(f ?? null)
    if (f && !meta.title)
      setMeta((m) => ({ ...m, title: f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) return
    const form = new FormData()
    // Fields must precede the file so the server sees them before streaming the upload.
    form.append('title', meta.title)
    form.append('artist', meta.artist)
    form.append('tags', meta.tags)
    form.append('category', meta.category)
    form.append('file', file)
    await upload.mutateAsync(form)
    onClose()
  }

  return (
    <Dialog title="Upload sound" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          Audio file
          <input
            type="file"
            accept={ACCEPT}
            required
            onChange={(e) => pick(e.target.files?.[0])}
            className="text-ink-muted"
          />
          <span className="text-sm text-peat-400">MP3, OGG, WAV, FLAC or M4A, up to 100 MB.</span>
        </label>
        <SoundFields value={meta} onChange={(p) => setMeta((m) => ({ ...m, ...p }))} />
        {upload.error && <p className="text-danger">{upload.error.message}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!file || upload.isPending}>
            {upload.isPending ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
