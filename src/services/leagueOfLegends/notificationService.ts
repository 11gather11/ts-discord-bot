import { config } from '@/config/config'
import { loseMessage, winMessage } from '@/config/leagueOfLegends'
import { logger } from '@/helpers/logger'
import { postTweet } from '@/lib/twitter'
import type { Rank, Status } from '@/types/leagueOfLegends'
import { type Client, EmbedBuilder } from 'discord.js'

const { DISCORD_LOL_CHANNEL_ID, DISCORD_GUILD_ID } = process.env
if (!(DISCORD_LOL_CHANNEL_ID && DISCORD_GUILD_ID)) {
	logger.error('環境変数が設定されていません')
	process.exit(1)
}

// Discordにメッセージを送信
const sendDiscordMessage = async (
	client: Client,
	embed: EmbedBuilder,
	contents = ''
): Promise<void> => {
	const guild = await client.guilds.fetch(DISCORD_GUILD_ID)
	const channel = await guild.channels.fetch(DISCORD_LOL_CHANNEL_ID)
	if (!channel) {
		return logger.error('指定されたチャンネルが見つかりませんでした')
	}
	if (!channel.isTextBased()) {
		return logger.error('指定されたチャンネルはテキストチャンネルではありません')
	}
	await channel.send({ content: contents, embeds: [embed] })
}

// 連勝連敗通知を送信する関数
export const sendStreakMessage = async (
	client: Client,
	name: string,
	tag: string,
	streak: number
): Promise<void> => {
	// 連勝か連敗かを判定
	const isWin = streak > 0
	const streakCount = Math.abs(streak)

	// メッセージを作成
	const message = `おい! 皆! ${name}#${tag} が${streakCount}${isWin ? '連勝してるぞwwwwww \n すごいぞ!wwwwww' : '連敗してるぞwwwwww \n 適正じゃないんじゃね？wwwwww'}`
	const embed = new EmbedBuilder()
		.setTitle(`${streakCount}${isWin ? '連勝' : '連敗'}通知`)
		.setColor(isWin ? config.colors.win : config.colors.lose)
		.setDescription(message)

	// メッセージを送信
	await sendDiscordMessage(client, embed, '@everyone')
	await postTweet(`${message} #LoL #LeagueOfLegends #LoL鯖`)
}

// ランク変更を通知する関数
export const sendRankChangeMessage = async (
	client: Client,
	previousRank: Rank,
	currentRank: Rank,
	name: string,
	tag: string,
	promotion: boolean
): Promise<void> => {
	// メッセージを作成
	const message = `${name}#${tag} が ${previousRank.tier} ${previousRank.rank} から ${currentRank.tier} ${currentRank.rank} に${
		promotion ? '昇格' : '降格'
	}しました！`
	const embed = new EmbedBuilder()
		.setTitle('ランク変更通知')
		.setColor(promotion ? config.colors.win : config.colors.lose)
		.setThumbnail(
			`https://static.bigbrain.gg/assets/lol/ranks/s13/${currentRank.tier.toLowerCase()}.png`
		)
		.setDescription(message)

	// メッセージを送信
	await sendDiscordMessage(client, embed, promotion ? '@here' : '@everyone')
	await postTweet(`${message} #LoL #LeagueOfLegends #LoLランク`)
}

// メッセージを送信する関数
export const sendMatchMessage = async (
	client: Client,
	win: boolean,
	status: Status,
	name: string,
	tag: string,
	rank: Rank
): Promise<void> => {
	// メッセージを作成
	const winLate = (rank.wins / (rank.wins + rank.losses)) * 100
	const title = win
		? (winMessage[status.kills] ?? winMessage[winMessage.length - 1])
		: (loseMessage[status.kills] ?? loseMessage[loseMessage.length - 1])
	const message = `${name}#${tag} が${win ? '勝ち' : '負け'}ました！ \n ${title} \n チャンピオン: ${status.champion} \n レーン: ${status.lane} \n CS: ${status.cs} \n KDA: ${status.kda} \n ダメージ量: ${status.damage}`
	const embed = new EmbedBuilder()
		.setTitle(title)
		.setColor(win ? config.colors.win : config.colors.lose)
		.setDescription('以下は最新のランクマッチの結果です')
		.addFields(
			{ name: 'プレイヤー', value: `${name}#${tag}`, inline: true },
			{ name: '結果', value: win ? '勝ち' : '負け', inline: true }
		)
		.addFields(
			{ name: 'チャンピオン', value: `${status.champion}`, inline: true },
			{ name: 'レーン', value: status.lane, inline: true }
		)
		.addFields({ name: 'アイテム', value: status.itemNames.join('\n') })
		.addFields(
			{ name: 'CS', value: status.cs, inline: true },
			{ name: 'KDA', value: status.kda, inline: true },
			{ name: 'ダメージ量', value: status.damage, inline: true }
		)
		.addFields(
			{ name: '勝率', value: `${winLate.toFixed(0)}%`, inline: true },
			{
				name: 'ランク',
				value: `${rank.tier} ${rank.rank} (${rank.leaguePoints} LP)`,
				inline: true,
			}
		)
		.setThumbnail(status.championIcon)

	// メッセージを送信
	await sendDiscordMessage(client, embed)
	await postTweet(`${message} #LoL #LeagueOfLegends #LoL鯖`)
}
