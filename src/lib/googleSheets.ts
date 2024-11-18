import { fetchPuuId, fetchSummonerId } from '@/api/lolApi'
import { keyFile } from '@/config/leagueOfLegends'
import { logger } from '@/helpers/logger'
import type { Player } from '@/types/leagueOfLegends'
import { google } from 'googleapis'

const { GOOGLE_SHEETS_ID } = process.env

// Google Sheets APIの認証情報を設定
const auth = new google.auth.GoogleAuth({
	keyFile: keyFile, // サービスアカウントのJSONファイルへのパス
	scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

// Google Sheets APIのクライアントを初期化
const sheets = google.sheets({ version: 'v4', auth })

// 設定ファイルを読み込む関数
export const fetchAllPlayers = async (): Promise<Player[]> => {
	try {
		const res = await sheets.spreadsheets.values.get({
			spreadsheetId: GOOGLE_SHEETS_ID, // スプレッドシートのID
			range: 'Players!A2:F', // データ範囲（ヘッダーは1行目と仮定）
		})

		const rows = res.data.values
		if (!rows || rows.length === 0) {
			logger.error('スプレッドシートにデータがありません')
			return []
		}
		// スプレッドシートのデータをJSON形式に変換
		return rows.map((row) => ({
			name: String(row[0]), // プレイヤー名
			tag: String(row[1]), // タグ
			puuId: String(row[2]), // puuId
			summonerId: String(row[3]), // summonerId
			discordId: String(row[4]), // DiscordID
			streak: Number(row[5]), // 負け続けている試合数
		}))
	} catch (error) {
		logger.error('スプレッドシートからのデータ読み込みに失敗しました:', error)
		return []
	}
}

// プレイヤーをスプレッドシートから削除
export const deletePlayer = async (rowIndex: number): Promise<void> => {
	await sheets.spreadsheets.batchUpdate({
		spreadsheetId: GOOGLE_SHEETS_ID as string,
		requestBody: {
			requests: [
				{
					deleteRange: {
						range: {
							sheetId: 0, // シートID（適切に設定してください）
							startRowIndex: rowIndex + 1, // データの1行目がA2:Bなので+1
							endRowIndex: rowIndex + 2, // 削除する行の次の行
						},
						shiftDimension: 'ROWS',
					},
				},
			],
		},
	})
}

// 新規プレイヤーをスプレッドシートに登録
export const addPlayer = async (
	name: string,
	tag: string,
	puuId: string,
	summonerId: string,
	discordId: string,
	streak: number
): Promise<void> => {
	await sheets.spreadsheets.values.append({
		spreadsheetId: GOOGLE_SHEETS_ID as string,
		range: 'Players!A2:F', // 追記する範囲
		valueInputOption: 'USER_ENTERED',
		requestBody: {
			values: [[name, tag, puuId, summonerId, discordId, streak]],
		},
	})
}

export const addStreak = async (
	puuId: string,
	losingStreak: number,
	players: Player[]
): Promise<void> => {
	const rowIndex = players.findIndex((row) => row.puuId === puuId)
	await sheets.spreadsheets.values.update({
		spreadsheetId: GOOGLE_SHEETS_ID as string,
		range: `Players!F${rowIndex + 2}`,
		valueInputOption: 'USER_ENTERED',
		requestBody: {
			values: [[losingStreak]],
		},
	})
}

// 名前とタグしかないひとに対してpuuIdとsummonerIdを取得して追加する
export const addPuuIdAndSummonerId = async (): Promise<void> => {
	const players = await fetchAllPlayers()

	for (const player of players) {
		const puuidResult = await fetchPuuId(player.name, player.tag)
		if (puuidResult.isErr()) {
			logger.error(puuidResult.error)
			return
		}
		const puuId = puuidResult.value
		const summonerIdResult = await fetchSummonerId(puuId)
		if (summonerIdResult.isErr()) {
			logger.error(summonerIdResult.error)
			return
		}
		const summonerId = summonerIdResult.value
		const lastPlayer = await fetchAllPlayers()
		const rowIndex = lastPlayer.findIndex(
			(row) => row.name === player.name && row.tag === player.tag
		)

		if (rowIndex === -1) {
			logger.error('プレイヤーが見つかりません')
			return
		}
		if (!(puuId && summonerId)) {
			logger.error('puuIdまたはsummonerIdが取得できません')
			return
		}

		await deletePlayer(rowIndex)
		await addPlayer(player.name, player.tag, puuId, summonerId, 'dummy', 0)
	}
}
