import type { Scene } from '@ogre/shared'
import { useNavigate } from 'react-router'
import { useDeleteScene, useDuplicateScene } from '../../api/scenes.ts'
import { Menu, MenuItem } from '../../ui/Menu.tsx'

export function SceneMenu({ scene, canEdit }: { scene: Scene; canEdit: boolean }) {
  const navigate = useNavigate()
  const duplicate = useDuplicateScene()
  const remove = useDeleteScene()

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
