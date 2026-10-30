import type { Sound, SoundUpload, SoundUsage } from '@ogre/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { api, json } from './client.ts'
import { keys } from './keys.ts'

export const useSounds = () =>
  useQuery({
    queryKey: keys.sounds,
    queryFn: () => api<Sound[]>('/api/sounds'),
    staleTime: 5 * 60_000,
  })

export type SoundStatus = 'loading' | 'missing' | 'ready'

/** Reactive counterpart to `engine.lookup`, so cards re-render once the library loads or changes. */
export function useSoundStatus() {
  const { data } = useSounds()
  const ids = useMemo(() => data && new Set(data.map((s) => s.id)), [data])
  return useCallback(
    (soundId: string | null): SoundStatus =>
      !ids ? 'loading' : soundId && ids.has(soundId) ? 'ready' : 'missing',
    [ids],
  )
}

export function useUploadSound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: FormData) => api<Sound>('/api/sounds', { method: 'POST', body: form }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.sounds }),
  })
}

export function useUpdateSound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<SoundUpload> }) =>
      api<Sound>(`/api/sounds/${id}`, json('PATCH', patch)),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.sounds }),
  })
}

export const fetchSoundUsage = (id: string) => api<SoundUsage>(`/api/sounds/${id}/usage`)

export function useDeleteSound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/sounds/${id}`, { method: 'DELETE' }),
    // The server cascades the delete to pads, favourites and recent plays.
    onSuccess: () =>
      Promise.all(
        [keys.sounds, keys.pads, keys.favourites, keys.recent].map((queryKey) =>
          qc.invalidateQueries({ queryKey }),
        ),
      ),
  })
}
