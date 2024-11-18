import { config } from '@/config/config'
import { EmbedBuilder, type Interaction } from 'discord.js'

// エラーメッセージを送信する関数
export const sendErrorReply = async (interaction: Interaction, message: string) => {
	const errorEmbed = new EmbedBuilder()
		.setTitle('⛔️エラー')
		.setDescription(message)
		.setColor(config.colors.error) // 赤色

	if (!interaction.isCommand()) {
		return
	}

	await interaction.reply({
		embeds: [errorEmbed],
		ephemeral: true,
	})

	setTimeout(() => {
		interaction.deleteReply()
	}, 10000) // 10秒後にエラーメッセージを削除
}
