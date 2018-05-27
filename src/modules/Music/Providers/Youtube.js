import ytdl from 'ytdl-core'
import { Provider } from '../Providers'

export const REGEX = /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9-_]{11}/

export default class Youtube extends Provider {
	static isValid (url) {
		return REGEX.test(url)
	}

	constructor (sender, url) {
		super()

		Object.assign(this, {
			sender,
			url,
			data: ytdl.getInfo(url)
		})
	}

	get stream () {
		return this.data.then(infos => ytdl.downloadFromInfo(infos, { filter: 'audioonly' }))
	}

	static get color () {
		return 0xff0000
	}

	get embed () {
		return this.infos.then(({ author, iurlmq, title, short_view_count_text, published, length_seconds }) => {
			const minutes = (length_seconds / 60).toFixed(0)
			const secondes = length_seconds % 60
			const length = `${minutes > 0 ? `${minutes}min` : ''}${seconds}s`

			return new RichEmbed()
				.setAuthor(author.name, author.avatar, author.channel_url)
				.setImage(iurlmq)
				.setTitle(title)
				.setURL(this.url)
				.setFooter(length)
				.setTimestamp(new Date(published))
				.setColor(this.color)
		})
	}

	get title() {
		return this.infos.then(({ title }) => title)
	}
}
