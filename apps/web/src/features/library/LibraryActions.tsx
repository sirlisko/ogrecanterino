import type { Sound } from '@ogre/shared'
import { fetchSoundUsage, useDeleteSound } from '../../api/sounds.ts'
import { useFavourites, useMe, useToggleFavourite } from '../../api/me.ts'
import { PAD_SLOTS, usePadSlots } from '../pads/usePadSlots.ts'
import { deleteSoundMessage } from './deleteMessage.ts'

export function LibraryActions({ sound }: { sound: Sound }) {
  const me = useMe().data
  const favourites = useFavourites().data ?? []
  const { pads, assign } = usePadSlots()
  const toggleFav = useToggleFavourite()
  const remove = useDeleteSound()
  const fav = favourites.includes(sound.id)
  const canDelete =
    !!me && (me.role === 'admin' || (sound.uploadedBy !== null && sound.uploadedBy === me.id))

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-pressed={fav}
        aria-label={
          fav ? `Remove ${sound.title} from favourites` : `Add ${sound.title} to favourites`
        }
        onClick={() => toggleFav.mutate({ soundId: sound.id, on: !fav })}
        className={`grid h-8 w-8 place-items-center rounded-full text-lg hover:bg-peat-700 ${fav ? 'text-brass' : 'text-peat-400'}`}
      >
        {fav ? '★' : '☆'}
      </button>
      <select
        aria-label={`Pin ${sound.title} to a quick pad`}
        value=""
        onChange={(e) => assign(Number(e.target.value), sound.id, sound.title)}
        className="w-24 rounded-md bg-peat-800 px-1.5 py-1 text-sm text-ink-muted ring-1 ring-peat-700"
      >
        <option value="" disabled>
          Pin to pad
        </option>
        {PAD_SLOTS.map((slot) => {
          const current = pads.find((p) => p.slot === slot)
          return (
            <option key={slot} value={slot}>
              {slot}: {current ? current.label : 'empty'}
            </option>
          )
        })}
      </select>
      {canDelete && (
        <button
          type="button"
          aria-label={`Delete ${sound.title}`}
          onClick={async () => {
            const usage = await fetchSoundUsage(sound.id)
            if (confirm(deleteSoundMessage(sound.title, usage))) remove.mutate(sound.id)
          }}
          className="grid h-8 w-8 place-items-center rounded-full text-peat-400 hover:bg-danger/15 hover:text-danger"
        >
          ✕
        </button>
      )}
    </div>
  )
}
