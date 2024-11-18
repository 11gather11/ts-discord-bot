import type { ChampionList, ItemList, MatchDetails, Rank } from '@/types/leagueOfLegends'
import { type Result, err, ok } from 'neverthrow'

const { RIOT_API_KEY } = process.env
if (!RIOT_API_KEY) {
	throw new Error('RIOT_API_KEYが設定されていません')
}

const RIOT_ASIA_URL = 'https://asia.api.riotgames.com'
const RIOT_JP_URL = 'https://jp1.api.riotgames.com'
const DDRAGON_URL = 'https://ddragon.leagueoflegends.com'

// APIリクエストの共通処理
const fetchRiotApi = async <T>(url: string): Promise<Result<T, Error>> => {
	try {
		const response = await fetch(url, {
			headers: {
				'X-Riot-Token': RIOT_API_KEY,
			},
		})
		if (!response.ok) {
			return err(new Error(`Riot APIからデータの取得に失敗しました: ${response.statusText}`))
		}
		const data = (await response.json()) as T
		return ok(data)
	} catch (error) {
		return err(new Error('Riot APIからデータの取得に失敗しました', error as Error))
	}
}

// puuIdを取得
export const fetchPuuId = async (name: string, tag: string): Promise<Result<string, Error>> => {
	const url = `${RIOT_ASIA_URL}/riot/account/v1/accounts/by-riot-id/${name}/${tag}`
	const dataResult = await fetchRiotApi<{ puuid: string }>(url)
	if (dataResult.isErr()) {
		return err(new Error('puuIdが取得できませんでした'))
	}
	return ok(dataResult.value.puuid)
}

// SummonerIdを取得
export const fetchSummonerId = async (puuId: string): Promise<Result<string, Error>> => {
	const url = `${RIOT_JP_URL}/lol/summoner/v4/summoners/by-puuid/${puuId}`
	const dataResult = await fetchRiotApi<{ id: string }>(url)
	if (dataResult.isErr()) {
		return err(new Error('サモナーIDが取得できませんでした'))
	}
	return ok(dataResult.value.id)
}

// マッチIDを取得
export const fetchLatestMatchId = async (puuId: string): Promise<Result<string, Error>> => {
	const url = `${RIOT_ASIA_URL}/lol/match/v5/matches/by-puuid/${puuId}/ids?start=0&count=1`
	const dataResult = await fetchRiotApi<string[]>(url)
	if (dataResult.isErr()) {
		return err(new Error('マッチIDが取得できませんでした'))
	}
	return ok(dataResult.value[0])
}

// マッチ詳細を取得
export const fetchMatchDetail = async (matchId: string): Promise<Result<MatchDetails, Error>> => {
	const url = `${RIOT_ASIA_URL}/lol/match/v5/matches/${matchId}`
	const dataResult = await fetchRiotApi<MatchDetails>(url)
	if (dataResult.isErr()) {
		return err(new Error('マッチ情報が取得できませんでした'))
	}
	return ok(dataResult.value)
}

// ランク情報を取得
export const fetchPlayerRank = async (summonerId: string): Promise<Result<Rank, Error>> => {
	const rankUrl = `${RIOT_JP_URL}/lol/league/v4/entries/by-summoner/${summonerId}`
	const rankDataResult = await fetchRiotApi<(Rank & { queueType: string })[]>(rankUrl)
	if (rankDataResult.isErr()) {
		return err(new Error('ランク情報が取得できませんでした'))
	}
	if (rankDataResult.value && rankDataResult.value.length > 0) {
		const soloRank = rankDataResult.value.find((entry) => entry.queueType === 'RANKED_SOLO_5x5')
		return soloRank ? ok(soloRank) : err(new Error('ソロランク情報が取得できませんでした'))
	}
	return err(new Error('ランク情報が取得できませんでした'))
}

// アイテム名一覧を取得
export const fetchItemList = async (version: string): Promise<Result<ItemList, Error>> => {
	const url = `${DDRAGON_URL}/cdn/${version}/data/ja_JP/item.json`
	const dataResult = await fetchRiotApi<{ data: ItemList }>(url)
	if (dataResult.isErr()) {
		return err(new Error('アイテム情報が取得できませんでした'))
	}
	return ok(dataResult.value.data)
}

// チャンピオン名一覧を取得
export const fetchChampionList = async (version: string): Promise<Result<ChampionList, Error>> => {
	const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/ja_JP/champion.json`
	const dataResult = await fetchRiotApi<{ data: ChampionList }>(url)
	if (dataResult.isErr()) {
		return err(new Error('チャンピオン情報が取得できませんでした'))
	}
	return ok(dataResult.value.data)
}

// バージョンを取得
export const fetchGameVersion = async (): Promise<Result<string, Error>> => {
	const url = 'https://ddragon.leagueoflegends.com/api/versions.json'
	const dataResult = await fetchRiotApi<string[]>(url)
	if (dataResult.isErr()) {
		return err(new Error('バージョン情報が取得できませんでした'))
	}
	return ok(dataResult.value[0])
}
