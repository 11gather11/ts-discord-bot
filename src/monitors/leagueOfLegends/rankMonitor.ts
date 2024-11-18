import { fetchLatestMatchId, fetchMatchDetail, fetchPlayerRank } from '@/api/lolApi'
import { logger } from '@/helpers/logger'
import { fetchAllPlayers } from '@/lib/googleSheets'
import {
	deleteMatchId,
	getStatus,
	initMatchId,
	isNewMatchId,
	isWinMatch,
	setMatchId,
} from '@/services/leagueOfLegends/matchService'
import {
	sendMatchMessage,
	sendRankChangeMessage,
	sendStreakMessage,
} from '@/services/leagueOfLegends/notificationService'
import {
	deleteRank,
	getRank,
	initRank,
	isRankChange,
	isRankHigher,
	setRank,
} from '@/services/leagueOfLegends/rankService'
import { updateStreak } from '@/services/leagueOfLegends/streakService'
import type { Rank } from '@/types/leagueOfLegends'
import type { Client } from 'discord.js'

// 監視中のプレイヤー情報
const monitoringTimers = new Map<string, ReturnType<typeof setInterval>>()

// 初期化処理
const initializePlayerData = async (
	puuId: string,
	summonerId: string,
	name: string,
	tag: string
): Promise<void> => {
	await Promise.all([initMatchId(puuId), initRank(summonerId, name, tag)])
}

// 連勝、連敗数の処理
const processStreak = async (
	client: Client,
	puuId: string,
	name: string,
	tag: string,
	win: boolean
): Promise<void> => {
	const players = await fetchAllPlayers()
	const streak = await updateStreak(puuId, win, players)
	if (!streak) {
		logger.error('連敗数が取得できませんでした')
		return
	}
	// 5の倍数の連勝、連敗の場合
	if (streak !== 0 && streak % 5 === 0) {
		await sendStreakMessage(client, name, tag, streak)
	}
}

// ランクが変更された場合の処理
const processRankChange = async (
	client: Client,
	name: string,
	tag: string,
	currentRank: Rank
): Promise<void> => {
	const previousRank = getRank(name, tag)
	if (!previousRank) {
		logger.error('前回のランク情報が取得できませんでした')
		return
	}

	if (isRankChange(name, tag, currentRank)) {
		await sendRankChangeMessage(
			client,
			previousRank,
			currentRank,
			name,
			tag,
			isRankHigher(name, tag, currentRank)
		)
		setRank(name, tag, currentRank)
	}
}

// 定期的なマッチチェック処理
const processMatch = async (
	client: Client,
	puuId: string,
	summonerId: string,
	name: string,
	tag: string
): Promise<void> => {
	const matchIdResult = await fetchLatestMatchId(puuId)
	if (matchIdResult.isErr()) {
		logger.error(matchIdResult.error)
		return
	}
	const matchId = matchIdResult.value

	const matchDetailResult = await fetchMatchDetail(matchId)
	if (matchDetailResult.isErr()) {
		logger.error(matchDetailResult.error)
		return
	}
	const matchDetail = matchDetailResult.value

	if (!isNewMatchId(matchId, puuId, matchDetail)) {
		return
	}

	setMatchId(matchId, puuId)

	const status = await getStatus(matchDetail, puuId)
	if (!status) {
		logger.error('ステータス情報が取得できませんでした')
		return
	}

	const rankResult = await fetchPlayerRank(summonerId)
	if (rankResult.isErr()) {
		logger.error(rankResult.error)
		return
	}
	const rank = rankResult.value

	const matchWin = isWinMatch(matchDetail, puuId)

	await sendMatchMessage(client, matchWin, status, name, tag, rank)
	await processStreak(client, puuId, name, tag, matchWin)
	await processRankChange(client, name, tag, rank)
}

// ランクチェックを開始
export const monitorLolRank = async (
	client: Client,
	name: string,
	tag: string,
	puuId: string,
	summonerId: string
): Promise<void> => {
	logger.success(`LoLランクチェックを開始: ${name}#${tag}`)
	try {
		await initializePlayerData(puuId, summonerId, name, tag)

		const key = `${name}#${tag}`
		if (monitoringTimers.has(key)) {
			logger.success(`${key} の監視は既に開始されています。`)
			return
		}

		const intervalId = setInterval(
			async () => {
				await processMatch(client, puuId, summonerId, name, tag)
			},
			1000 * 60 * 5 // 5分ごとにチェック
		)

		// タイマーを保存
		monitoringTimers.set(key, intervalId)
	} catch (error) {
		logger.error('エラーが発生しました:', error)
	}
}

// ランクチェックを停止
export const stopLolRankMonitoring = (name: string, tag: string, puuId: string): void => {
	const key = `${name}#${tag}`

	const intervalId = monitoringTimers.get(key)
	if (!intervalId) {
		logger.success(`${key} は現在監視されていません。`)
		return
	}

	clearInterval(intervalId)
	monitoringTimers.delete(key)
	deleteRank(name, tag)
	deleteMatchId(puuId)
	logger.success(`${key} の監視を終了しました。`)
}

// ランクチェックを開始
export const monitorAllLolRanks = async (client: Client): Promise<void> => {
	for (const player of await fetchAllPlayers()) {
		await monitorLolRank(client, player.name, player.tag, player.puuId, player.summonerId)
	}
}
