import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Command } from '@/types/client'
import { Client, Collection, GatewayIntentBits } from 'discord.js'

// 環境変数
const { DISCORD_TOKEN } = process.env

if (!DISCORD_TOKEN) {
	throw new Error('環境変数が設定されていません')
}

// 新しいClientインスタンスを作成
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMembers,
	],
})

// コマンドを格納するコレクション
client.commands = new Collection<string, Command>()
client.cooldowns = new Collection<string, number>()

const handlersDir = join(__dirname, './handlers')
for (const file of readdirSync(handlersDir)) {
	if (!(file.endsWith('.ts') || file.endsWith('.js'))) {
		continue
	}
	const { default: handler } = await import(join(handlersDir, file))
	handler(client)
}

client.login(DISCORD_TOKEN)
