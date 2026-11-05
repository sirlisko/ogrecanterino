import type { Sound } from '@ogre/shared'
import { useQuery } from '@tanstack/react-query'
import { fetchSoundUsage, useDeleteSound } from '../../api/sounds.ts'
import { Button } from '../../ui/Button.tsx'
import { Dialog } from '../../ui/Dialog.tsx'
import { deleteSoundMessage } from './deleteMessage.ts'

/** Deleting removes the file too, so the dialog says which scenes will lose it first. */
export function DeleteSoundDialog({ sound, onClose }: { sound: Sound; onClose: () => void }) {
  const usage = useQuery({
    queryKey: ['sounds', sound.id, 'usage'],
    queryFn: () => fetchSoundUsage(sound.id),
    gcTime: 0,
  })
  const remove = useDeleteSound()

  return (
    <Dialog title="Delete sound" onClose={onClose}>
      {usage.isPending && <p className="text-ink-muted">Checking which scenes use it…</p>}
      {usage.error && (
        <p className="text-danger">
          Couldn't check which scenes use it ({usage.error.message}). Try again in a moment.
        </p>
      )}
      {usage.data && (
        <div className="flex flex-col gap-3">
          {deleteSoundMessage(sound.title, usage.data)
            .split('\n\n')
            .map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
        </div>
      )}
      {remove.error && <p className="mt-3 text-danger">{remove.error.message}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="danger"
          disabled={!usage.data || remove.isPending}
          onClick={async () => {
            await remove.mutateAsync(sound.id)
            onClose()
          }}
        >
          Delete sound
        </Button>
      </div>
    </Dialog>
  )
}
