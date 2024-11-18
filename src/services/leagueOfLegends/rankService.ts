import { fetchPlayerRank } from '@/api/lolApi'
import { lolOrder } from '@/config/leagueOfLegends'
import { logger } from '@/helpers/logger'
import type { Rank } from '@/types/leagueOfLegends'

// 監視中のプレイヤー情報
const lastPlayerRank = new Map<string, Rank>()

// ランク情報を更新
export const setRank = (name: string, tag: string, rank: Rank): void => {
	lastPlayerRank.set(generatePlayerKey(name, tag), rank)
}

// ランク情報を取得
export const getRank = (name: string, tag: string): Rank | undefined => {
	return lastPlayerRank.get(generatePlayerKey(name, tag))
}

// ランク情報を削除
export const deleteRank = (name: string, tag: string): void => {
	lastPlayerRank.delete(generatePlayerKey(name, tag))
}

// キー生成関数
const generatePlayerKey = (name: string, tag: string): string => {
	return `${name}#${tag}`
}

// ランク情報を初期化
export const initRank = async (summonerId: string, name: string, tag: string): Promise<void> => {
	const rankResult = await fetchPlayerRank(summonerId)
	if (rankResult.isErr()) {
		logger.error(rankResult.error)
		return
	}
	const rank = rankResult.value
	lastPlayerRank.set(generatePlayerKey(name, tag), rank)
}

// ランクが変更されたかどうかを判定
export const isRankChange = (name: string, tag: string, currentRank: Rank): boolean => {
	const previousRank = lastPlayerRank.get(generatePlayerKey(name, tag))
	return previousRank?.tier !== currentRank.tier || previousRank?.rank !== currentRank.rank
}

// ランクを比較して昇格か降格かを判定
export const isRankHigher = (name: string, tag: string, currentRank: Rank): boolean => {
	// ティアとランクを分割
	const previousRank = lastPlayerRank.get(generatePlayerKey(name, tag))
	if (!previousRank) {
		logger.error('ランク情報が取得できませんでした')
		return false
	}

	// ティアの順序を取得
	const currentTierIndex = lolOrder.tierOrder.indexOf(currentRank.tier)
	const previousTierIndex = lolOrder.tierOrder.indexOf(previousRank.tier)

	// ティアの順序を比較
	if (currentTierIndex !== previousTierIndex) {
		return currentTierIndex > previousTierIndex
	}

	// ティアが同じ場合ランクの順序を比較
	const currentRankIndex = lolOrder.rankOrder.indexOf(currentRank.rank)
	const previousRankIndex = lolOrder.rankOrder.indexOf(previousRank.rank)
	return currentRankIndex > previousRankIndex
}
