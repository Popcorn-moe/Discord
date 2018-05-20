import { configurable, on, RichEmbed } from '@popcorn.moe/migi'
import { embeds, load } from '../utils'

const MSG_REGEX = /^(.+) (https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_+.~#?&/=]*))(?: (.+))?$/

@configurable('suggestions', {
	themes: [
		'404',
		'kiss',
		'slap',
		'hug',
		'pat',
		'ask',
		'cake',
		'cuddle',
		'glare',
		'highfive',
		'poke',
		'punch',
		'angry',
		'error'
	],
	themes_message:
		'- __Site__: 404\n- __Bot__: kiss, slap, hug, pat, ask, cake, cuddle, glare, highfive, poke, punch, angry, error'
})
export default class Suggestions {
	constructor(migi, settings) {
		this.migi = migi
		this.settings = settings
	}

	@on('ready')
	onReady() {
		return Promise.all(
			this.migi.settings.guilds
				.map(sGuild => [
					this.migi.guilds.get(sGuild.id),
					sGuild.channels.suggestions
				])
				.map(([guild, sChannel]) => guild.channels.get(sChannel))
				.map(channel => channel && channel.fetchMessages({ limit: 100 })) //Allow the bot to listen to reactions in previous messages.
		)
	}

	@on('message')
	onMessage(message) {
		const { author, content, channel } = message
		if (message.author.bot) return

		if (!this.isSuggestionsChannel(message)) return

		const reg = MSG_REGEX.exec(content)

		if (!reg || !this.settings.themes.includes(reg[1])) {
			const embed = embeds
				.err(
					'Erreur: le format pour envoyer une suggestion de gif/image est le suivant:'
				)
				.setDescription(
					"`{thème} {url} [optionnel: description]`\n*Veuillez fournir l'anime d'origine / auteur de l'image en" +
						' description.*'
				)
				.addField('Thèmes', this.settings.themes_message, true)
				.addField('Votre message', `\`${message.content}\``, true)
				.setFooter('Que le moe soit avec vous, jeune padawan.')

			return Promise.all([message.delete(), author.send({ embed })])
		}

		const [, theme, url, desc] = reg

		const embed = new RichEmbed()
			.setAuthor(message.author.username, message.author.avatarURL)
			.addField('Thème', theme, true)
			.addField('URL', url, true)
			.setDescription(desc)
			.setImage(url)
			.setColor(0xe0a826)
			.setTimestamp()

		return Promise.all([
			message.delete(),
			message.channel
				.send(author, { embed })
				.then(message => message.react('👍')) //Ensure order
				.then(({ message }) => message.react('👎'))
				.then(({ message }) => message.react('❌'))
		])
	}

	@on('messageReactionAdd')
	onReaction(reaction, user) {
		if (!this.isSuggestionsChannel(reaction.message)) return

		const embed = reaction.message.embeds[0]
		if (!embed) return

		const sender = reaction.message.mentions.users.first()

		if (reaction.emoji.name === '❌' && sender === user)
			return reaction.message.delete()
	}

	isSuggestionsChannel({ channel, guild }) {
		const sGuild =
			guild && this.migi.settings.guilds.find(({ id }) => id === guild.id)
		return (
			sGuild && sGuild.channels && channel.id === sGuild.channels.suggestions
		)
	}
}
