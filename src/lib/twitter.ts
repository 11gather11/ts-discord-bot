import { logger } from '@/helpers/logger'
import TwitterApi from 'twitter-api-v2'

const {
	TWITTER_API_KEY,
	TWITTER_API_SECRET_KEY,
	TWITTER_ACCESS_TOKEN,
	TWITTER_ACCESS_TOKEN_SECRET,
} = process.env

if (
	!(
		TWITTER_API_KEY &&
		TWITTER_API_SECRET_KEY &&
		TWITTER_ACCESS_TOKEN &&
		TWITTER_ACCESS_TOKEN_SECRET
	)
) {
	throw new Error('Twitterの環境変数が設定されていません')
}

// Twitter APIのクライアントを初期化
const twitterClient = new TwitterApi({
	appKey: TWITTER_API_KEY,
	appSecret: TWITTER_API_SECRET_KEY,
	accessToken: TWITTER_ACCESS_TOKEN,
	accessSecret: TWITTER_ACCESS_TOKEN_SECRET,
})

// ツイートを投稿
export const postTweet = async (text: string): Promise<void> => {
	try {
		await twitterClient.v2.tweet(text)
	} catch (error) {
		logger.error('ツイートの投稿に失敗しました:', error)
	}
}
