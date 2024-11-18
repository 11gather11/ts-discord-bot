import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { logger } from '@/helpers/logger'
import type { Client } from 'discord.js'

const deployEvents = async (client: Client) => {
	const eventsDir = join(__dirname, '../events')

	for (const file of readdirSync(eventsDir)) {
		if (!(file.endsWith('.ts') || file.endsWith('.js'))) {
			continue
		}
		const { default: event } = await import(join(eventsDir, file))
		event.once
			? client.once(event.name, (...args) => event.execute(...args))
			: client.on(event.name, (...args) => event.execute(...args))
		logger.success(`イベントファイル ${file} を読み込みました`)
	}
}

export default deployEvents
