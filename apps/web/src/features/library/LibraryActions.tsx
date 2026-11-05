import type { Sound } from '@ogre/shared'
import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useFavourites, useMe, useToggleFavourite } from '../../api/me.ts'
import { Icon } from '../../ui/Icon.tsx'
import { Menu, MenuItem } from '../../ui/Menu.tsx'
import { AssignPadDialog } from '../pads/AssignPadDialog.tsx'
import { DeleteSoundDialog } from './DeleteSoundDialog.tsx'
import { EditSoundDialog } from './EditSoundDialog.tsx'

export function LibraryActions({ sound }: { sound: Sound }) {
  const me = useMe().data
  const favourites = useFavourites().data ?? []
  const toggleFav = useToggleFavourite()
  const [dialog, setDialog] = useState<'assign' | 'edit' | 'delete' | null>(null)
  const root = useRef<HTMLDivElement>(null)
  // The menu item that opened the dialog is gone, so focus would otherwise fall to the page.
  // The dialog has to unmount first: while it's open, everything behind it is inert.
  const close = () => {
    flushSync(() => setDialog(null))
    root.current?.querySelector<HTMLElement>('[aria-haspopup="menu"]')?.focus()
  }
  const fav = favourites.includes(sound.id)
  const canEdit =
    !!me && (me.role === 'admin' || (sound.uploadedBy !== null && sound.uploadedBy === me.id))

  return (
    <div ref={root} className="flex items-center gap-1">
      <button
        type="button"
        aria-pressed={fav}
        aria-label={
          fav ? `Remove ${sound.title} from favourites` : `Add ${sound.title} to favourites`
        }
        onClick={() => toggleFav.mutate({ soundId: sound.id, on: !fav })}
        className={`grid h-9 w-9 place-items-center rounded-full text-lg hover:bg-peat-700 ${fav ? 'text-brass' : 'text-peat-400'}`}
      >
        <Icon name="star" outline={!fav} className="h-5 w-5" />
      </button>
      <Menu label={`Actions for ${sound.title}`}>
        <MenuItem onSelect={() => setDialog('assign')}>Assign to pad…</MenuItem>
        {canEdit && <MenuItem onSelect={() => setDialog('edit')}>Edit</MenuItem>}
        {canEdit && (
          <MenuItem danger onSelect={() => setDialog('delete')}>
            Delete
          </MenuItem>
        )}
      </Menu>
      {dialog === 'assign' && <AssignPadDialog sound={sound} onClose={close} />}
      {dialog === 'edit' && <EditSoundDialog sound={sound} onClose={close} />}
      {dialog === 'delete' && <DeleteSoundDialog sound={sound} onClose={close} />}
    </div>
  )
}
