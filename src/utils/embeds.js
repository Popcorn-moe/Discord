import { RichEmbed } from 'discord.js';
import load from './load';
import { randomIn } from '.';

const { images } = load('global.json');

export function err(title) {
	const embed = new RichEmbed()
		.setColor(0xdb1348)
		.setImage(randomIn(images.error))
		.setFooter('Please fix me senpaii!!', images.siteIcon)
		.setTimestamp();
	if (title) embed.setTitle(title);
	return embed;
}

export function timeDelete(message) {
	return new Promise((resolve, reject) =>
		setTimeout(() => resolve(message.delete()), 2 * 60 * 1000)
	);
}
