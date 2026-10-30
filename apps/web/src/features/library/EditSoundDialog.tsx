import type { Sound } from '@ogre/shared'
import { type FormEvent, useState } from 'react'
import { useUpdateSound } from '../../api/sounds.ts'
import { Button } from '../../ui/Button.tsx'
import { Dialog } from '../../ui/Dialog.tsx'
import { parseTagList, type SoundMeta, SoundFields } from './SoundFields.tsx'

export function EditSoundDialog({ sound, onClose }: { sound: Sound; onClose: () => void }) {
  const update = useUpdateSound()
  const [meta, setMeta] = useState<SoundMeta>({
    title: sound.title,
    artist: sound.artist,
    tags: sound.tags.join(', '),
    category: sound.category,
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await update.mutateAsync({ id: sound.id, patch: { ...meta, tags: parseTagList(meta.tags) } })
    onClose()
  }

  return (
    <Dialog title="Edit sound" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <SoundFields value={meta} onChange={(p) => setMeta((m) => ({ ...m, ...p }))} />
        {update.error && <p className="text-danger">{update.error.message}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save sound'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
