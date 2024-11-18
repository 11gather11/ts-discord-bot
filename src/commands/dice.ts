import { config } from '@/config/config'
import type { Command } from '@/types/client'
import { sendErrorReply } from '@/utils/sendErrorReply'
import { toHalfWidth } from '@/utils/toHalfWidth'
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'

const command: Command = {
	command: new SlashCommandBuilder()
		.setName('ダイス')
		.setDescription('ダイスを振るコマンドです。')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('通常')
				.setDescription('ダイスを振って結果を返します。')
				.addStringOption((option) =>
					option
						.setName('式')
						.setDescription(
							'入力例: 1d100 ← 100面のダイスを1回振る場合 1d10+1d6 ← 10面のダイスを1回振った結果と6面のダイスを1回振った結果を足す場合'
						)
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('シークレット')
				.setDescription('ダイスを振って結果を返します。(他のユーザーには見えません)')
				.addStringOption((option) =>
					option
						.setName('式')
						.setDescription(
							'入力例: 1d100 ← 100面のダイスを1回振る場合 1d10+1d6 ← 10面のダイスを1回振った結果と6面のダイスを1回振った結果を足す場合'
						)
						.setRequired(true)
				)
		),

	execute: async (interaction) => {
		const subcommand = interaction.options.getSubcommand()
		const expression = interaction.options.getString('式') ?? ''
		const result = rollDice(expression)

		const isSecret = subcommand === 'secret'

		if (!result.success) {
			return await sendErrorReply(interaction, result.message)
		}

		// ダイス結果を埋め込みメッセージとして表示
		const resultEmbed = new EmbedBuilder()
			.setTitle(`${config.icons.dice} ダイスロール結果`)
			.setDescription(result.message)
			.setColor(config.colors.success) // 緑色

		await interaction.reply({
			embeds: [resultEmbed],
			ephemeral: isSecret, // secret の場合は他のユーザーには見えない
		})
	},
	cooldown: 5,
}

// ダイス式の正規表現
const regex = /^(\d+)d(\d+)$/

export const rollDice = (expression: string): { success: boolean; message: string } => {
	// 正規表現で複数のダイス式を抽出
	const convertExpression = toHalfWidth(expression)
	const dicePatterns = convertExpression.split('+')
	const rolls: number[] = []
	const results: string[] = []

	for (const pattern of dicePatterns) {
		const match = pattern.trim().match(regex)
		if (!match) {
			return {
				success: false,
				message: '無効なフォーマットです。NdM形式を使用してください（例:2d6）。',
			}
		}
		const numDice = Number.parseInt(match[1], 10)
		const sides = Number.parseInt(match[2], 10)
		const patternRolls: number[] = []
		for (let i = 0; i < numDice; i++) {
			patternRolls.push(Math.floor(Math.random() * sides) + 1)
		}
		rolls.push(...patternRolls)
		results.push(`(${patternRolls.join(' + ')})`)
	}

	const total = rolls.reduce((acc, cur) => acc + cur, 0)

	let message: string
	if (dicePatterns.length > 1) {
		message = `${convertExpression} → ${results.join(' + ')} = ${total}`
	} else {
		message = `${convertExpression} → ${results[0]} = ${total}`
	}

	return { success: true, message }
}

export default command
