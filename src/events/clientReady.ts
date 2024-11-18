import { logger } from '@/helpers/logger'
import { monitorAllLolRanks } from '@/monitors/leagueOfLegends/rankMonitor'
import type { BotEvent } from '@/types/client'
import { type Client, Events } from 'discord.js'

const event: BotEvent = {
	name: Events.ClientReady,
	once: true,

	execute: async (client: Client) => {
		logger.success(`ログイン成功: ${client.user?.tag}`)
		await monitorAllLolRanks(client)
	},
}

export default event
