import { Toast } from '../../ui/Toast.tsx'
import { commitDelete, undoDelete, usePendingDelete } from './pendingDelete.ts'

export function DeleteToast() {
  const scene = usePendingDelete((s) => s.pending?.scene)
  if (!scene) return null
  return (
    <Toast action="Undo" onAction={undoDelete} onDismiss={commitDelete}>
      Deleted {scene.name}
    </Toast>
  )
}
