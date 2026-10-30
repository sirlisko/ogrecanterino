import type { Me, Pad } from '@ogre/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError, json } from './client.ts'
import { keys } from './keys.ts'

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: async () => {
      try {
        return await api<Me>('/api/me')
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null
        throw e
      }
    },
    staleTime: Infinity,
  })
}

export const useFavourites = () =>
  useQuery({ queryKey: keys.favourites, queryFn: () => api<string[]>('/api/me/favourites') })

export const usePads = () =>
  useQuery({ queryKey: keys.pads, queryFn: () => api<Pad[]>('/api/me/pads') })

export const useRecent = () =>
  useQuery({ queryKey: keys.recent, queryFn: () => api<string[]>('/api/me/recent') })

export function useToggleFavourite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ soundId, on }: { soundId: string; on: boolean }) =>
      api<void>(`/api/me/favourites/${soundId}`, { method: on ? 'PUT' : 'DELETE' }),
    onMutate: ({ soundId, on }) => {
      qc.setQueryData<string[]>(keys.favourites, (prev = []) =>
        on ? [...prev, soundId] : prev.filter((id) => id !== soundId),
      )
    },
  })
}

export function useSavePads() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pads: Pad[]) => api<Pad[]>('/api/me/pads', json('PUT', pads)),
    onMutate: (pads) => qc.setQueryData(keys.pads, pads),
  })
}

export function useRecordPlay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (soundId: string) => api<void>(`/api/me/recent/${soundId}`, { method: 'POST' }),
    onMutate: (soundId) =>
      qc.setQueryData<string[]>(keys.recent, (prev = []) => [
        soundId,
        ...prev.filter((id) => id !== soundId),
      ]),
  })
}
