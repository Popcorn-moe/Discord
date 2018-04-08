import { RichEmbed } from 'discord.js';
import { on } from '../decorators';
import { client } from '../discord';
import { embeds, load } from '../utils';

const gSettings = load('global.json');
const settings = load('Suggestions.json');

const MSG_REGEX = /^(.+) (https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_+.~#?&/=]*))(?: (.+))?$/;

export default class Suggestions {
	@on('ready')
	onReady() {
		return Promise.all(
			gSettings.guilds
				.map(sGuild => [
					client.guilds.get(sGuild.id),
					sGuild.channels.suggestions
				])
				.map(([guild, sChannel]) => guild.channels.get(sChannel))
				.map(channel => channel.fetchMessages({ limit: 100 })) //Allow the bot to listen to reactions in previous messages.
		);
	}

	@on('message')
	onMessage(message) {
		const { author, content, channel } = message;
		if (message.author.bot) return;

		if (!this.isSuggestionsChannel(message)) return;

		const reg = MSG_REGEX.exec(content);

		if (!reg || !settings.themes.includes(reg[1])) {
			const embed = embeds
				.err(
					'Erreur: le format pour envoyer une suggestion de gif/image est le suivant:'
				)
				.setDescription(
					"`{thème} {url} [optionnel: description]`\n*Veuillez fournir l'anime d'origine / auteur de l'image en" +
						' description.*'
				)
				.addField('Thèmes', settings.themes_message, true)
				.addField('Votre message', `\`${message.content}\``, true)
				.setFooter('Que le moe soit avec vous, jeune padawan.');

			return Promise.all([message.delete(), author.send({ embed })]);
		}

		const [, theme, url, desc] = reg;

		const embed = new RichEmbed()
			.setAuthor(message.author.username, message.author.avatarURL)
			.addField('Thème', theme, true)
			.addField('URL', url, true)
			.setDescription(desc)
			.setImage(url)
			.setColor(0xe0a826)
			.setTimestamp();

		return Promise.all([
			message.delete(),
			message.channel
				.send(author, { embed })
				.then(message => message.react('👍')) //Ensure order
				.then(({ message }) => message.react('👎'))
				.then(({ message }) => message.react('❌'))
		]);
	}

	@on('messageReactionAdd')
	onReaction(reaction, user) {
		if (!this.isSuggestionsChannel(reaction.message)) return;

		const embed = reaction.message.embeds[0];
		if (!embed) return;

		const sender = reaction.message.mentions.users.first();

		if (reaction.emoji.name === '❌' && sender === user)
			return reaction.message.delete();
	}

	isSuggestionsChannel({ channel, guild }) {
		const sGuild = guild && gSettings.guilds.get(guild.id);
		return (
			sGuild && sGuild.channels && channel.id === sGuild.channels.suggestions
		);
	}
}
