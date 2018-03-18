import fetch from 'node-fetch';
import { RichEmbed } from 'discord.js';
import EventEmitter from 'events';
import WebSocket from 'ws';
import { errHandle } from '../../utils';

export default class ListenMoeStreamer extends EventEmitter {
	static isValid(url) {
		return url.toLowerCase().includes('listen.moe');
	}

	constructor(adder) {
		super();
		this.adder = adder;
	}

	get stream() {
		const ws = new WebSocket('wss://listen.moe/api/v2/socket');

		ws.on(
			'message',
			errHandle(
				data => {
					if (!data) return;
					const parsed = JSON.parse(data);
					if (parsed.song_name) {
						this.infos = parsed;
						return this.emit('music');
					}
				},
				err => this.emit('error', err)
			)
		);

		return fetch(`https://listen.moe/stream`).then(res => res.body);
	}

	get embed() {
		return Promise.resolve(
			this.infos
				? new RichEmbed()
						.setTitle(`${this.infos.artist_name} - ${this.infos.song_name}`)
						.setImage('https://listen.moe/files/images/kanna.gif')
						.setFooter(
							`Requested by ${this.infos.requested_by || 'anonymous'} - ${
								this.infos.listeners
							} auditeurs`
						)
						.setColor(0xec1a55)
				: new RichEmbed()
						.setTitle('Listen.moe')
						.setImage('http://listen.moe/files/images/fb_share.jpg')
						.setColor(0xec1a55)
		);
	}

	get title() {
		return Promise.resolve(
			this.infos
				? `${this.infos.artist_name} - ${this.infos.song_name}`
				: 'Listen.moe'
		);
	}
}
