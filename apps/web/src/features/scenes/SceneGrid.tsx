import type { Scene } from '@ogre/shared'
import { useMe } from '../../api/me.ts'
import { usePendingDelete } from './pendingDelete.ts'
import { SceneCard } from './SceneCard.tsx'
import { useSceneLayout } from './sceneLayout.ts'
import { SceneRow } from './SceneRow.tsx'

/** Scenes as tiles or as a list, whichever this device last chose. */
export function SceneGrid({ scenes, numbered }: { scenes: Scene[]; numbered?: boolean }) {
  const me = useMe().data
  const deleting = usePendingDelete((s) => s.pending?.scene.id)
  const layout = useSceneLayout((s) => s.layout)
  const shown = scenes.filter((s) => s.id !== deleting)
  const canEdit = (s: Scene) => me?.role === 'admin' || s.ownerId === me?.id

  if (layout === 'list') {
    return (
      <ul className="mt-5 border-t border-peat-700">
        {shown.map((s) => (
          <SceneRow key={s.id} scene={s} canEdit={canEdit(s)} />
        ))}
      </ul>
    )
  }
  return (
    <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3.5">
      {shown.map((s, i) => (
        <SceneCard
          key={s.id}
          scene={s}
          canEdit={canEdit(s)}
          position={numbered ? i + 1 : undefined}
        />
      ))}
    </div>
  )
}
