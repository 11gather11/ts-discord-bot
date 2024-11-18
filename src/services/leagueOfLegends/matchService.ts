import {
	fetchChampionList,
	fetchGameVersion,
	fetchItemList,
	fetchLatestMatchId,
} from '@/api/lolApi'
import { logger } from '@/helpers/logger'
import {
	getChampionName,
	getItemNames,
	isChampionCacheValidate,
	isItemCacheValidate,
	updateChampionList,
	updateItemList,
} from '@/services/leagueOfLegends/cacheService'
import type { MatchDetails, Status } from '@/types/leagueOfLegends'

const lastMatchId = new Map<string, string>()

// マッチIDを削除
export const deleteMatchId = (puuId: string): void => {
	lastMatchId.delete(puuId)
}

// マッチIDが新しいかどうかを判定
export const isNewMatchId = (
	matchId: string,
	puuId: string,
	matchDetail: MatchDetails
): boolean => {
	return (
		lastMatchId.get(puuId) !== matchId &&
		matchDetail.info.endOfGameResult === 'GameComplete' &&
		matchDetail.info.queueId === 420
	)
}

// 勝敗を判定
export const isWinMatch = (matchDetails: MatchDetails, puuId: string): boolean => {
	const participant = matchDetails.info.participants.find((p) => p.puuid === puuId)
	if (!participant) {
		throw new Error('プレイヤーが見つかりません')
	}
	return participant.win
}

// マッチIDを更新
export const setMatchId = (matchId: string, puuId: string): void => {
	lastMatchId.set(puuId, matchId)
}

// マッチIDを初期化
export const initMatchId = async (puuId: string): Promise<void> => {
	const matchIdResult = await fetchLatestMatchId(puuId)
	if (matchIdResult.isErr()) {
		logger.error(matchIdResult.error)
		return
	}
	const matchId = matchIdResult.value
	lastMatchId.set(puuId, matchId)
}

// プレイヤーのステータス情報を取得する関数
export const getStatus = async (
	matchDetail: MatchDetails,
	puuId: string
): Promise<Status | undefined> => {
	const versionResult = await fetchGameVersion()
	if (versionResult.isErr()) {
		logger.error(versionResult.error)
		return
	}
	const version = versionResult.value

	// アイテムIDと名前の対応表を取得
	if (!isItemCacheValidate(version)) {
		const itemListResult = await fetchItemList(version)
		if (itemListResult.isErr()) {
			logger.error(itemListResult.error)
			return
		}
		const itemList = itemListResult.value
		updateItemList(version, itemList)
	}

	// チャンピオンIDと名前の対応表を取得
	if (!isChampionCacheValidate(version)) {
		const championListResult = await fetchChampionList(version)
		if (championListResult.isErr()) {
			logger.error(championListResult.error)
			return
		}
		const championList = championListResult.value
		updateChampionList(version, championList)
	}

	// プレイヤーのステータス情報を取得
	const participant = matchDetail.info.participants.find((p) => p.puuid === puuId)
	if (!participant) {
		logger.error(`プレイヤーが見つかりません${puuId}`)
		return
	}

	// ステータス情報を整形
	const lane = participant.teamPosition || '不明なレーン'
	const champion = getChampionName(participant.championId)
	const championIcon = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${participant.championName}.png`
	const cs = (participant.totalMinionsKilled + participant.neutralMinionsKilled).toString() || '0'
	const kills = participant.kills || 0
	const deaths = participant.deaths || 0
	const assists = participant.assists || 0
	const kda = `${kills}/${deaths}/${assists}`
	const damage = participant.totalDamageDealtToChampions.toString() || '0'
	const itemIds = [
		participant.item0,
		participant.item1,
		participant.item2,
		participant.item3,
		participant.item4,
		participant.item5,
	].filter((id) => id !== 0) // 0は未購入のアイテム
	const itemNames = getItemNames(itemIds)

	return {
		lane,
		champion,
		championIcon,
		cs,
		kills,
		kda,
		damage,
		itemNames,
	}
}
