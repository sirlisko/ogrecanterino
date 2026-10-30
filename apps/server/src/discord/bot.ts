import { ChannelType, Client, Events, GatewayIntentBits } from 'discord.js'

export interface VoiceChannelInfo {
  guildId: string
  guildName: string
  channelId: string
  channelName: string
  userIsHere: boolean
}

export class DiscordBot {
  readonly client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  })
  private ready = false

  constructor(private allowedGuildIds: string[]) {
    this.client.once(Events.ClientReady, (c) => {
      this.ready = true
      console.info(`Discord bot logged in as ${c.user.tag} in ${c.guilds.cache.size} server(s)`)
    })
  }

  async login(token: string) {
    await this.client.login(token)
  }

  get isReady() {
    return this.ready
  }

  get inviteUrl(): string | null {
    const id = this.client.application?.id
    // Connect + Speak + View Channel
    return id
      ? `https://discord.com/oauth2/authorize?client_id=${id}&scope=bot&permissions=3146752`
      : null
  }

  guild(guildId: string) {
    if (!this.isAllowed(guildId)) return undefined
    return this.client.guilds.cache.get(guildId)
  }

  private isAllowed(guildId: string) {
    return this.allowedGuildIds.length === 0 || this.allowedGuildIds.includes(guildId)
  }

  /** Voice channels in servers shared by the bot and the user; their current channel sorts first. */
  async voiceChannelsFor(discordUserId: string): Promise<VoiceChannelInfo[]> {
    const result: VoiceChannelInfo[] = []
    for (const guild of this.client.guilds.cache.values()) {
      if (!this.isAllowed(guild.id)) continue
      const member = await guild.members.fetch(discordUserId).catch(() => null)
      if (!member) continue
      const current = guild.voiceStates.cache.get(discordUserId)?.channelId
      for (const channel of guild.channels.cache.values()) {
        if (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice)
          continue
        if (!channel.permissionsFor(member)?.has('Connect')) continue
        result.push({
          guildId: guild.id,
          guildName: guild.name,
          channelId: channel.id,
          channelName: channel.name,
          userIsHere: channel.id === current,
        })
      }
    }
    return result.sort(
      (a, b) =>
        Number(b.userIsHere) - Number(a.userIsHere) || a.channelName.localeCompare(b.channelName),
    )
  }

  async destroy() {
    await this.client.destroy()
  }
}
