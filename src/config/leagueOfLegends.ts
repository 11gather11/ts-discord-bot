import path from 'node:path'

export const keyFile = path.join(__dirname, './ts-lolserver-discord.json')

export const lolOrder = {
	tierOrder: [
		'IRON',
		'BRONZE',
		'SILVER',
		'GOLD',
		'PLATINUM',
		'DIAMOND',
		'MASTER',
		'GRANDMASTER',
		'CHALLENGER',
	],
	rankOrder: ['IV', 'III', 'II', 'I'],
}

export const winMessage = [
	'0キルってwwwバス乗ってランク上げるのが楽しいでチュか?wwww',
	'1キルだけで勝てて良かったねぇwwwバス乗りさんwww',
	'ナイスバス乗りwww',
	'味方がうまくて良かったやん！',
	'お前が真のバス乗りや！',
	'ナイス運ゲー！',
	'相手が下手で良かったやん！',
	'お前がバス乗りの王や！',
	'お前がバス乗りの神や！',
	'お前がバス乗りの帝王や！',
	'やるやん',
]
export const loseMessage = [
	'0キルってwww適正じゃないだろwww',
	'1キルだけで負けるとかwwwお荷物やんけww',
	'サポートですらこのスコアはねぇwwww',
	'センスねぇから辞めちまいなwwww',
	'やめちまえヘタクソwwww',
	'頑張ったけど勝てない人がいまーすwww',
	'雑魚すぎクソワロタwwwww',
	'チームゲーム向いてねぇよwwww',
	'キルして勝てるゲームじゃないからwwww',
	'9キルでキャリーできないとかwww',
	'こんなに頑張ったのに勝てないでチュねぇwwwww',
]
