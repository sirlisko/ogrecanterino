import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, json } from './client.ts'

export interface DiscordStatus {
  configured: boolean
  ready: boolean
  inviteUrl: string | null
  session: { guildId: string; channelId: string; channelName: string; streaming: boolean } | null
}

export interface VoiceChannel {
  guildId: string
  guildName: string
  channelId: string
  channelName: string
  userIsHere: boolean
}

const statusKey = ['discord', 'status'] as const

export const useDiscordStatus = () =>
  useQuery({ queryKey: statusKey, queryFn: () => api<DiscordStatus>('/api/discord/status') })

export const useVoiceChannels = (enabled: boolean) =>
  useQuery({
    queryKey: ['discord', 'channels'],
    queryFn: () => api<VoiceChannel[]>('/api/discord/channels'),
    enabled,
  })

export function useConnectVoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { guildId: string; channelId: string }) =>
      api('/api/discord/connect', json('POST', body)),
    onSettled: () => qc.invalidateQueries({ queryKey: statusKey }),
  })
}

export function useDisconnectVoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api('/api/discord/disconnect', { method: 'POST' }),
    onSettled: () => qc.invalidateQueries({ queryKey: statusKey }),
  })
}
