import type { SoundCategory } from '@ogre/shared'
import { type FormEvent, useState } from 'react'
import { useUploadSound } from '../../api/sounds.ts'
import { Button } from '../../ui/Button.tsx'
import { Dialog, fieldClass } from '../../ui/Dialog.tsx'
import { DropZone } from './DropZone.tsx'
import { guessCategory, readDurationMs, titleFromFilename } from './guessCategory.ts'

interface Item {
  key: string
  file: File
  title: string
  category: SoundCategory
  state: 'ready' | 'uploading' | 'done' | 'error'
  error?: string
}

const CATEGORY_LABEL = { music: 'Music', ambience: 'Ambience', effect: 'Effect' }

export function UploadDialog({ onClose }: { onClose: () => void }) {
  const upload = useUploadSound()
  const [items, setItems] = useState<Item[]>([])
  const [artist, setArtist] = useState('')
  const [tags, setTags] = useState('')
  const [busy, setBusy] = useState(false)
  const patch = (key: string, p: Partial<Item>) =>
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...p } : i)))

  const add = async (files: File[]) => {
    const added = await Promise.all(
      files.map(async (file) => ({
        key: crypto.randomUUID(),
        file,
        title: titleFromFilename(file.name),
        category: guessCategory(file.name, await readDurationMs(file)),
        state: 'ready' as const,
      })),
    )
    setItems((list) => [...list, ...added])
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    for (const item of items.filter((i) => i.state !== 'done')) {
      patch(item.key, { state: 'uploading' })
      const form = new FormData()
      // Fields must precede the file so the server sees them before streaming the upload.
      form.append('title', item.title)
      form.append('artist', artist)
      form.append('tags', tags)
      form.append('category', item.category)
      form.append('file', item.file)
      try {
        await upload.mutateAsync(form)
        patch(item.key, { state: 'done' })
      } catch (err) {
        patch(item.key, { state: 'error', error: err instanceof Error ? err.message : 'failed' })
      }
    }
    setBusy(false)
  }

  const pending = items.filter((i) => i.state !== 'done')
  const finished = items.length > 0 && pending.length === 0

  return (
    <Dialog title="Upload sounds" onClose={onClose} wide>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <DropZone onFiles={(f) => void add(f)} disabled={busy} />
        {items.length > 0 && (
          <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {items.map((item) => (
              <li key={item.key} className="flex items-center gap-2">
                <input
                  value={item.title}
                  onChange={(e) => patch(item.key, { title: e.target.value })}
                  aria-label={`Title for ${item.file.name}`}
                  disabled={item.state === 'done'}
                  required
                  className={`${fieldClass} min-w-0 flex-1 py-1.5`}
                />
                <select
                  value={item.category}
                  onChange={(e) => patch(item.key, { category: e.target.value as SoundCategory })}
                  aria-label={`Type of ${item.file.name}`}
                  disabled={item.state === 'done'}
                  className="rounded-lg bg-peat-900 px-2 py-1.5 ring-1 ring-peat-600"
                >
                  {(['music', 'ambience', 'effect'] as const).map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
                <span className="w-24 text-right text-sm" role="status">
                  {item.state === 'uploading' && <span className="text-ink-muted">Uploading…</span>}
                  {item.state === 'done' && <span className="text-lichen">Uploaded</span>}
                  {item.state === 'error' && (
                    <span className="text-danger" title={item.error}>
                      Failed
                    </span>
                  )}
                  {item.state === 'ready' && (
                    <button
                      type="button"
                      onClick={() => setItems((l) => l.filter((i) => i.key !== item.key))}
                      className="text-ink-muted hover:text-danger"
                    >
                      Remove
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            Artist or source
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Needed for the credits page"
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            Tags for all of them
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tavern, Calm, Night"
              className={fieldClass}
            />
          </label>
        </div>
        {items.some((i) => i.state === 'error') && (
          <p className="text-danger">
            Some files failed: {items.find((i) => i.state === 'error')?.error}. Fix or remove them,
            then upload again.
          </p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button onClick={onClose}>{finished ? 'Done' : 'Cancel'}</Button>
          {!finished && (
            <Button type="submit" variant="primary" disabled={!pending.length || busy}>
              {busy
                ? 'Uploading…'
                : `Upload ${pending.length || ''} sound${pending.length === 1 ? '' : 's'}`}
            </Button>
          )}
        </div>
      </form>
    </Dialog>
  )
}
