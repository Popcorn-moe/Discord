import { RichEmbed } from 'discord.js';
import { random } from '.';
import load from './load';

const settings = load('global.json');

export function err(title) {
	const embed = new RichEmbed()
		.setColor(0xdb1348)
		.setImage(random(settings.images.error));
	if (title) embed.setTitle(title);
	return embed;
}

export function timeDelete(message) {
	return new Promise((resolve, reject) =>
		setTimeout(() => resolve(message.delete()), 10000)
	);
}
