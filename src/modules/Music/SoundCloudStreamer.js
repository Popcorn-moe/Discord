import fetch from 'node-fetch';
import { RichEmbed } from 'discord.js';
import EventEmitter from 'events';
import { errHandle } from '../../utils';

const SOUNDCLOUD_CLIENT_ID = 'w2p3gZDE9uBZm44hI659z80z1Y1lcjnF';

const EXTRACT_REGEX = /var c=(\[.*\]),o=Date\.now\(\)/;

export default class SoundCloudStreamer extends EventEmitter {
	static isValid(url) {
		return url.startsWith('https://soundcloud.com/');
	}

	constructor(adder, url) {
		super();
		this.adder = adder;
		this.url = url;
		this.infos = this.fetchInfos();
	}

	fetchInfos() {
		return fetch(this.url)
			.then(res => res.text())
			.then(page => EXTRACT_REGEX.exec(page)[1])
			.then(extracted => JSON.parse(extracted).map(({ data: [data] }) => data))
			.then(json => json.find(({ kind }) => kind === 'track'));
	}

	get stream() {
		errHandle(() => this.emit('music'), e => this.emit('error', e))();
		return this.infos
				.then(({ uri }) => fetch(`${uri}/stream?client_id=${SOUNDCLOUD_CLIENT_ID}`))
				.then(res => res.body);
	}

	get embed() {
		return this.infos.then(
			({ user, artwork_url, title, created_at, playback_count, duration }) => {
				const sec = (duration / 1000).toFixed(0);
				const minutes = (sec / 60).toFixed(0);
				const seconds = sec % 60;

				const length = (minutes > 0 ? `${minutes}min ` : '') + `${seconds}s`;

				return new RichEmbed()
					.setAuthor(user.username, user.avatar_url, user.permalink_url)
					.setImage(artwork_url)
					.setTitle(title)
					.setURL(this.url)
					.setFooter(`${length} - Ecouté ${playback_count} fois`)
					.setTimestamp(new Date(created_at))
					.setColor(0xff5500);
			}
		);
	}

	get title() {
		return this.infos.then(({ title }) => title);
	}
}
