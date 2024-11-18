// 全角文字を半角文字に変換する関数
export const toHalfWidth = (str: string): string => {
	return (
		str
			// 全角の記号と数字、アルファベットを半角に変換
			.replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
			// 全角スペースを半角スペースに変換
			.replace(/\u3000/g, ' ')
	)
}
