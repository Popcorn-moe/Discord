import fetch from 'node-fetch'
import { RichEmbed } from 'discord.js'
import EventEmitter from 'events'
import WebSocket from 'ws'

export default class ListenMoeStreamer extends EventEmitter {
	static isValid(url) {
		return url.toLowerCase().includes('listen.moe')
	}

	constructor(adder) {
		super()
		this.adder = adder
	}

	get stream() {
		const ws = new WebSocket('wss://listen.moe/gateway')

		ws.on('message', data => {
			if (!data) return
			const { op, d } = JSON.parse(data)
			switch (op) {
				case 1:
					this.infos = d
					this.emit('music')
					break
			}
		})

		ws.on('open', () => {
			ws.send(JSON.stringify({ op: 0, d: { auth: 'Bearer null' } }))
		})

		return fetch(`https://listen.moe/stream`).then(res => res.body)
	}

	get embed() {
		if (this.infos) {
			const artists = this.infos.song.artists
				.map(({ name, nameRomaji }) => nameRomaji || name)
				.join(', ')
			return Promise.resolve(
				new RichEmbed()
					.setTitle(`${artists} - ${this.infos.song.title}`)
					.setFooter(
						`Requested by ${this.infos.requester || 'anonymous'} - ${
							this.infos.listeners
						} auditeurs`
					)
					.setColor(0xec1a55)
			)
		} else {
			return Promise.resolve(
				new RichEmbed().setTitle('Listen.moe').setColor(0xec1a55)
			)
		}
	}

	get title() {
		return Promise.resolve(
			this.infos
				? `${this.infos.artist_name} - ${this.infos.song_name}`
				: 'Listen.moe'
		)
	}
}
