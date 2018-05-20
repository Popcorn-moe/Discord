import { command, on } from '@popcorn.moe/migi'
import googleTTSApi from 'google-tts-api/lib/api'
import googleTTSKey from 'google-tts-api/lib/key'
import fetch from 'node-fetch'
import { embeds } from '../utils'

export default class Voice {
	constructor() {
		this.category = {
			icon: '🇫🇷', //FR flag
			name: 'Text to speech'
		}

		this.key = googleTTSKey()
		this.keyRefresh = setInterval(() => (this.key = googleTTSKey()), 3600000) //1h
	}

	@command(/^say(?:_([^ ]+))? (.+)$/i, {
		name: 'say',
		desc: 'Dire une phrase',
		usage: '[_langue] [message]',
		clean: true
	})
	say({ member, channel }, lang = 'fr', text) {
		if (!channel.guild.voiceConnection)
			return channel
				.send({ embed: embeds.err("Le bot n'est connecté à aucun channel !") })
				.then(msg => embeds.timeDelete(msg))

		return this.key
			.then(key => googleTTSApi(text, key, lang, 1))
			.then(url => fetch(url))
			.then(res => res.body)
			.then(stream =>
				channel.guild.voiceConnection.playStream(stream, { volume: 0.75 })
			)
	}

	@on('destroy')
	destroy() {
		clearInterval(this.keyRefresh)
	}
}
