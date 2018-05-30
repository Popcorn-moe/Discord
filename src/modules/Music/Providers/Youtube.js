import ytdl from 'ytdl-core'
import { Provider } from '../Providers'
import { RichEmbed } from 'discord.js'

export default class Youtube extends Provider {
	static isValid (url) {
		return ytdl.validateURL(url)
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
		return this.data.then(({ author, thumbnail_url, title, short_view_count_text, published, length_seconds }) => {
			const minutes = (length_seconds / 60).toFixed(0)
			const seconds = length_seconds % 60
			const length = `${minutes > 0 ? `${minutes}m` : ''}${seconds}s`

			return new RichEmbed()
				.setAuthor(author.name, author.avatar, author.channel_url)
				.setThumbnail(thumbnail_url)
				.setTitle(title)
				.setURL(this.url)
				.setFooter(length)
				.setTimestamp(new Date(published))
				.setColor(this.constructor.color)
		})
	}

	get title() {
		return this.data.then(({ title }) => title)
	}
}
