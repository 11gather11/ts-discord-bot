// Match情報の型定義
export interface MatchDetails {
	info: {
		participants: Participant[]
		queueId: number
		endOfGameResult: string
	}
}
// Participantの型定義
export interface Participant {
	puuid: string
	win: boolean
	championId: number
	championName: string
	lane: string
	kills: number
	deaths: number
	assists: number
	totalMinionsKilled: number
	neutralMinionsKilled: number
	totalDamageDealtToChampions: number
	item0: number
	item1: number
	item2: number
	item3: number
	item4: number
	item5: number
	teamPosition: string
	// 他にも必要なフィールドがあればここに追加
}

export interface Status {
	lane: string
	champion: string
	championIcon: string
	cs: string
	kills: number
	kda: string
	damage: string
	itemNames: string[]
}

export interface Rank {
	tier: string
	rank: string
	leaguePoints: number
	wins: number
	losses: number
}

export interface ItemList {
	[key: string]: { name: string }
}

export interface ChampionList {
	[key: string]: { key: string; name: string }
}

export interface Player {
	name: string
	tag: string
	puuId: string
	summonerId: string
	discordId: string
	streak: number
}
