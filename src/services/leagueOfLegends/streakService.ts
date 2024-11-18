import { logger } from '@/helpers/logger'
import { addStreak } from '@/lib/googleSheets'
import type { Player } from '@/types/leagueOfLegends'

// 連勝、連敗数を更新 勝った場合は+1、負けた場合は-1
export const updateStreak = async (
	puuId: string,
	win: boolean,
	players: Player[]
): Promise<number | undefined> => {
	const player = players.find((p) => p.puuId === puuId)
	if (!player) {
		logger.error('プレイヤーが見つかりませんでした')
		return
	}

	let { streak } = player

	// 勝敗によって連勝数を更新
	if (win) {
		streak += 1
	} else {
		streak -= 1
	}

	// ストリークをリセットする場合
	if (streak > 0 && win === false) {
		streak = 0
	} else if (streak < 0 && win === true) {
		streak = 0
	}

	await addStreak(puuId, streak, players)
	return streak
}
