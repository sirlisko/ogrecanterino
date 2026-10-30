import type { Sound, SoundUsage } from '@ogre/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client.ts'
import { keys } from './keys.ts'

export const useSounds = () =>
  useQuery({
    queryKey: keys.sounds,
    queryFn: () => api<Sound[]>('/api/sounds'),
    staleTime: 5 * 60_000,
  })

export function useUploadSound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: FormData) => api<Sound>('/api/sounds', { method: 'POST', body: form }),
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
