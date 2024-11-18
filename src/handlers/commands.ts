import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { logger } from '@/helpers/logger'
import {
	type APIApplicationCommand,
	type Client,
	REST,
	Routes,
	type SlashCommandBuilder,
} from 'discord.js'

// 環境変数
const { DISCORD_CLIENT_ID, DISCORD_GUILD_ID, DISCORD_TOKEN } = process.env
if (!(DISCORD_CLIENT_ID && DISCORD_GUILD_ID && DISCORD_TOKEN)) {
	throw new Error('環境変数が設定されていません')
}

const deployCommands = async (client: Client) => {
	const commandsDir = join(__dirname, '../commands')

	const commands = await getCommands(commandsDir, client)

	await registerCommands(commands)
}

const getCommands = async (dir: string, client: Client): Promise<SlashCommandBuilder[]> => {
	const commands: SlashCommandBuilder[] = []
	for (const file of readdirSync(dir)) {
		if (!(file.endsWith('.ts') || file.endsWith('.js'))) {
			continue
		}
		const { default: command } = await import(join(dir, file))
		if (command.command) {
			commands.push(command.command)
			client.commands.set(command.command.name, command)
		} else {
			logger.warn(`コマンドファイル ${file} に SlashCommand の要素が見つかりません`)
		}
	}
	return commands
}

const registerCommands = async (slashCommands: SlashCommandBuilder[]) => {
	const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN)

	try {
		const env = process.env.NODE_ENV === 'development' ? '開発' : '本番'
		const route =
			env === '開発'
				? Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID)
				: Routes.applicationCommands(DISCORD_CLIENT_ID)

		const data = (await rest.put(route, {
			body: slashCommands.map((command) => command.toJSON()),
		})) as APIApplicationCommand[]
		logger.success(`${env}環境用 ${data.length} 個のコマンドを登録しました`)
	} catch (error) {
		logger.error(error)
	}
}

export default deployCommands
