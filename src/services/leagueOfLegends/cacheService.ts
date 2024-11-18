import type { ChampionList, ItemList } from '@/types/leagueOfLegends'

let itemListData: { [key: string]: { name: string } } = {}
let championListData: { [key: string]: { key: string; name: string } } = {}
let previousVersion: string | undefined

// アイテム名一覧を更新
export const updateItemList = (version: string, itemList: ItemList): void => {
	previousVersion = version
	itemListData = itemList
}

// チャンピオン名一覧を更新
export const updateChampionList = (version: string, championList: ChampionList): void => {
	previousVersion = version
	championListData = championList
}

// アイテム名を取得
export const getItemNames = (itemIds: number[]): string[] => {
	return itemIds
		.filter((id) => id !== 0) // IDが0のアイテムは除外
		.map((id) => itemListData[id.toString()]?.name || '不明なアイテム')
}

// チャンピオン名を取得
export const getChampionName = (championId: number): string => {
	const champion = Object.values(championListData).find(
		(c) => Number.parseInt(c.key) === championId
	)
	return champion ? champion.name : '不明なチャンピオン'
}

// アイテム名一覧がキャッシュされているか確認
export const isItemCacheValidate = (currentVersion: string): boolean => {
	return currentVersion === previousVersion && Object.keys(itemListData).length > 0
}

// チャンピオン名一覧がキャッシュされているか確認
export const isChampionCacheValidate = (currentVersion: string): boolean => {
	return currentVersion === previousVersion && Object.keys(championListData).length > 0
}
