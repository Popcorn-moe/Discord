import { configurable, RichEmbed } from '@popcorn.moe/migi'
import { embeds, members, load, randomIn } from '../utils'
import * as configuration from './Image.json'

const COMMAND_MATCH = '^$command(?: <@!?(\\d+)>)?'

@configurable('image', configuration)
export default class Image {
	constructor(migi, { category, commands, usage }) {
		this.migi = migi

		this.category = category
		this.commands = commands
		this.usage = usage

		process.nextTick(() => this.setup())
	}

	setup() {
		Object.entries(this.commands).forEach(([name, cmd]) =>
			this.setupOne(name, cmd)
		)
	}

	setupOne(name, { desc, msg, gifs }) {
		const regex = new RegExp(COMMAND_MATCH.replace('$command', name), 'i')

		this[name] = (message, mention) => {
			const { member, guild } = message

			return Promise.all([
				message.delete(),
				this.response(
					message,
					msg,
					gifs,
					mention ? message.member : message.guild.me,
					mention ? message.guild.members.get(mention) : message.member
				)
			])
		}

		this.migi.command(regex, this, name, {
			name,
			desc,
			usage: this.usage
		})
	}

	response(message, msg, gifs, from, to) {
		if (!to) {
			const embed = embeds.err('Aucun utilisateur trouvé 😭')

			return message.channel
				.send({ embed })
				.then(message => embeds.timeDelete(message))
		}

		const send = msg
			.replace('{0}', from.displayName)
			.replace('{1}', to.displayName)

		const embed = new RichEmbed()
			.setTitle(send)
			.setColor(0x00ae86)
			.setImage(randomIn(gifs))

		return message.channel.send({ embed })
	}
}
