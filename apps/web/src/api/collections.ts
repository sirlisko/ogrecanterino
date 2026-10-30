import type { Collection, CollectionInput } from '@ogre/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, json } from './client.ts'
import { keys } from './keys.ts'

export const collectionsQuery = {
  queryKey: keys.collections,
  queryFn: () => api<Collection[]>('/api/collections'),
}

export const useCollections = () => useQuery(collectionsQuery)

export const collectionInputOf = ({
  name,
  visibility,
  combatSceneId,
  sceneIds,
}: Collection): CollectionInput => ({ name, visibility, combatSceneId, sceneIds })

export function useSaveCollection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CollectionInput }) =>
      id
        ? api<Collection>(`/api/collections/${id}`, json('PUT', input))
        : api<Collection>('/api/collections', json('POST', input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.collections }),
  })
}

export function useDeleteCollection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/collections/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.collections }),
  })
}
