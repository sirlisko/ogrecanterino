import type { SoundCategory } from '@ogre/shared'
import { type FormEvent, useState } from 'react'
import { useUploadSound } from '../../api/sounds.ts'
import { Button } from '../../ui/Button.tsx'
import { Dialog, fieldClass } from '../../ui/Dialog.tsx'

const ACCEPT = '.mp3,.ogg,.oga,.opus,.wav,.flac,.m4a,.webm,audio/*'

export function UploadDialog({ onClose }: { onClose: () => void }) {
  const upload = useUploadSound()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [tags, setTags] = useState('')
  const [category, setCategory] = useState<SoundCategory>('effect')

  const pick = (f: File | undefined) => {
    setFile(f ?? null)
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) return
    const form = new FormData()
    // Fields must precede the file so the server sees them before streaming the upload.
    form.append('title', title)
    form.append('artist', artist)
    form.append('tags', tags)
    form.append('category', category)
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
        <label className="flex flex-col gap-1">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          Artist or source
          <input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Needed for the credits page"
            className={fieldClass}
          />
        </label>
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1">Type</legend>
          <div className="flex gap-4">
            {(['music', 'ambience', 'effect'] as const).map((c) => (
              <label key={c} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="category"
                  checked={category === c}
                  onChange={() => setCategory(c)}
                  className="accent-brass"
                />
                {{ music: 'Music', ambience: 'Ambience', effect: 'Effect' }[c]}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1">
          Tags
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tavern, Calm, Night"
            className={fieldClass}
          />
        </label>
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
