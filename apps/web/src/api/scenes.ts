import type { Scene, SceneInput } from '@ogre/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, json } from './client.ts'
import { keys } from './keys.ts'

export const useScenes = () =>
  useQuery({ queryKey: keys.scenes, queryFn: () => api<Scene[]>('/api/scenes') })

export const useScene = (id: string | undefined) =>
  useQuery({
    queryKey: keys.scene(id ?? ''),
    queryFn: () => api<Scene>(`/api/scenes/${id}`),
    enabled: !!id,
  })

export function useSaveScene() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: SceneInput }) =>
      id
        ? api<Scene>(`/api/scenes/${id}`, json('PUT', input))
        : api<Scene>('/api/scenes', json('POST', input)),
    onSuccess: (scene) => {
      qc.setQueryData(keys.scene(scene.id), scene)
      void qc.invalidateQueries({ queryKey: keys.scenes, exact: true })
    },
  })
}

export function useDuplicateScene() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<Scene>(`/api/scenes/${id}/duplicate`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.scenes, exact: true }),
  })
}

export function useDeleteScene() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/scenes/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.scenes, exact: true }),
  })
}

export function useImportScenes() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: unknown) =>
      api<{ imported: string[]; missing: { scene: string; files: string[] }[] }>(
        '/api/scenes/import',
        json('POST', body),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.scenes, exact: true }),
  })
}

export function useUploadBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData()
      form.append('file', file)
      return api<Scene>(`/api/scenes/${id}/banner`, { method: 'POST', body: form })
    },
    onSuccess: (scene) => {
      qc.setQueryData(keys.scene(scene.id), scene)
      void qc.invalidateQueries({ queryKey: keys.scenes, exact: true })
    },
  })
}
