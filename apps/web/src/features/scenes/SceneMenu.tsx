import type { Collection, Scene } from '@ogre/shared'
import { useNavigate } from 'react-router'
import { collectionInputOf, useCollections, useSaveCollection } from '../../api/collections.ts'
import { useMe } from '../../api/me.ts'
import { useDeleteScene, useDuplicateScene } from '../../api/scenes.ts'
import { Menu, MenuItem } from '../../ui/Menu.tsx'

export function SceneMenu({ scene, canEdit }: { scene: Scene; canEdit: boolean }) {
  const navigate = useNavigate()
  const duplicate = useDuplicateScene()
  const remove = useDeleteScene()
  const me = useMe().data
  const collections = (useCollections().data ?? []).filter(
    (c) => me?.role === 'admin' || c.ownerId === me?.id,
  )
  const saveCollection = useSaveCollection()
  const toggleIn = (c: Collection, on: boolean) =>
    saveCollection.mutate({
      id: c.id,
      input: {
        ...collectionInputOf(c),
        sceneIds: on ? [...c.sceneIds, scene.id] : c.sceneIds.filter((id) => id !== scene.id),
      },
    })

  return (
    <Menu label={`Actions for ${scene.name}`}>
      {canEdit && <MenuItem onSelect={() => navigate(`/scenes/${scene.id}/edit`)}>Edit</MenuItem>}
      <MenuItem
        onSelect={async () => {
          const copy = await duplicate.mutateAsync(scene.id)
          navigate(`/scenes/${copy.id}/edit`)
        }}
      >
        Duplicate
      </MenuItem>
      {collections.map((c) => {
        const inside = c.sceneIds.includes(scene.id)
        return (
          <MenuItem key={c.id} onSelect={() => toggleIn(c, !inside)}>
            {inside ? `Remove from ${c.name}` : `Add to ${c.name}`}
          </MenuItem>
        )
      })}
      <MenuItem onSelect={() => window.open(`/api/scenes/${scene.id}/export`, '_blank')}>
        Export JSON
      </MenuItem>
      {canEdit && (
        <MenuItem
          danger
          onSelect={() => {
            if (confirm(`Delete "${scene.name}"? This can't be undone.`)) remove.mutate(scene.id)
          }}
        >
          Delete
        </MenuItem>
      )}
    </Menu>
  )
}
