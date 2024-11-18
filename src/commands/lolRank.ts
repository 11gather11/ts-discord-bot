import { fetchPuuId, fetchSummonerId } from '@/api/lolApi'
import { addPlayer, deletePlayer, fetchAllPlayers } from '@/lib/googleSheets'
import { monitorLolRank, stopLolRankMonitoring } from '@/monitors/leagueOfLegends/rankMonitor'
import { getRank } from '@/services/leagueOfLegends/rankService'
import type { Command } from '@/types/client'
import { sendErrorReply } from '@/utils/sendErrorReply'
import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
	type User,
} from 'discord.js'

const command: Command = {
	command: new SlashCommandBuilder()
		.setName('lol_rank')
		.setDescription('LoLのランクの勝敗の通知')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('register')
				.setDescription('LoLのランクの勝敗の通知を登録します')
				.addUserOption((option) =>
					option.setName('user').setDescription('Discordのユーザー').setRequired(true)
				)
				.addStringOption((option) =>
					option.setName('name').setDescription('LoLの名前').setRequired(true)
				)
				.addStringOption((option) =>
					option.setName('tag').setDescription('LoLのタグ').setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('unregister')
				.setDescription('LoLのランクの勝敗の通知を解除します')
				.addUserOption((option) =>
					option.setName('user').setDescription('Discordのユーザー').setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('list').setDescription('登録されているLoLの名前とタグを表示します')
		),

	execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
		// サブコマンドを取得
		const subcommand = interaction.options.getSubcommand()

		// サブコマンドによって処理を分岐
		if (subcommand === 'register') {
			// 登録処理
			await register(interaction)
		} else if (subcommand === 'unregister') {
			// 解除処理
			await unregister(interaction)
		} else if (subcommand === 'list') {
			// リスト表示
			await list(interaction)
		}
	},
}
// 登録処理
const register = async (interaction: ChatInputCommandInteraction): Promise<void> => {
	const name = interaction.options.getString('name') as string
	const tag = interaction.options.getString('tag') as string
	const user = interaction.options.getUser('user') as User

	const puuidResult = await fetchPuuId(name, tag)
	if (puuidResult.isErr()) {
		await sendErrorReply(interaction, `${name}#${tag} は存在しません`)
		return
	}
	const puuId = puuidResult.value

	// スプレッドシートからデータを取得
	const players = await fetchAllPlayers()

	// プレイヤーが存在するか確認
	if (players.some((row) => row.discordId === user.id)) {
		await sendErrorReply(
			interaction,
			`${user.globalName} は既に登録されています。\n一人1アカウントです。`
		)
		return
	}

	// 名前とタグが重複していないか確認
	if (
		players.some(
			(row) =>
				row.name.toLowerCase() === name.toLowerCase() && row.tag.toLowerCase() === tag.toLowerCase()
		)
	) {
		await sendErrorReply(interaction, `${name}#${tag} は既に登録されています`)
		return
	}

	const summonerIdResult = await fetchSummonerId(puuId)
	if (summonerIdResult.isErr()) {
		await sendErrorReply(interaction, `${name}#${tag} は存在しません`)
		return
	}
	const summonerId = summonerIdResult.value

	const streak = 0

	// 新規プレイヤーをスプレッドシートに登録
	await addPlayer(name, tag, puuId, summonerId, user.id, streak)
	// クライアントを取得
	const client = interaction.client
	// ユーザーのランクを関し
	await monitorLolRank(client, name, tag, puuId, summonerId)
	// メッセージを送信
	await interaction.reply(`${user.globalName} を登録しました`)
}

// 登録解除処理
const unregister = async (interaction: ChatInputCommandInteraction): Promise<void> => {
	// ユーザーを取得
	const user = interaction.options.getUser('user') as User

	// スプレッドシートからデータを取得
	const players = await fetchAllPlayers()

	// プレイヤーが存在するか確認
	const rowIndex = players.findIndex((row) => row.discordId === user.id)
	if (rowIndex === -1) {
		await sendErrorReply(interaction, `${user.globalName} は登録されていません`)
		return
	}
	const player = players[rowIndex]

	// スプレッドシートからプレイヤーを削除
	await deletePlayer(rowIndex)
	stopLolRankMonitoring(player.name, player.tag, player.puuId)
	// メッセージを送信
	await interaction.reply(`${user.globalName} を登録解除しました`)
}

const list = async (interaction: ChatInputCommandInteraction): Promise<void> => {
	// スプレッドシートを読み込む
	const players = await fetchAllPlayers()

	const playersData = await Promise.all(
		players.map((row) => {
			const rank = getRank(row.name, row.tag) || { tier: 'UnRanked', rank: '' }
			return {
				...row,
				rank,
			}
		})
	)

	// データがない場合
	if (players.length === 0) {
		await sendErrorReply(interaction, '登録されているプレイヤーはいません')
		return
	}

	// 埋め込みメッセージを作成
	const embed = new EmbedBuilder()
		.setTitle('登録されているプレイヤー')
		.setDescription(
			playersData
				.map(
					(row) => `${row.name}#${row.tag}  ${row.rank.tier} ${row.rank.rank}  ${row.streak}連敗中`
				)
				.join('\n')
		)

	// メッセージを送信
	await interaction.reply({
		embeds: [embed],
		ephemeral: true,
	})
}

export default command
