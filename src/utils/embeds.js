import { RichEmbed } from 'discord.js'
import { randomIn } from '.'

export function err(title) {
	const embed = new RichEmbed()
		.setColor(0xdb1348)
		//		.setImage(randomIn(images.error))
		.setFooter('Please fix me senpaii!!')
		.setTimestamp()
	if (title) embed.setTitle(title)
	return embed
}

export function timeDelete(message) {
	return message.delete(2 * 60 * 1000)
}
