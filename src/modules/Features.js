import { RichEmbed } from 'discord.js';
import { on } from '../decorators';
import { load } from '../utils';
import { client } from '../discord';

const settings = load('global.json');

export default class Features {
	@on('ready')
	onReady() {
		return Promise.all(
			settings.guilds
				.map(sGuild => [
					client.guilds.get(sGuild.id),
					sGuild.channels.features
				])
				.map(([guild, sChannel]) =>
					guild.channels.get(sChannel)
				)
				.map(channel => channel.fetchMessages({ limit: 100 })) //Allow the bot to listen to reactions in previous messages.
		);
	}

	@on('message')
	onMessage(message) {
		const { author, content, channel } = message;
		if (message.author.bot) return;

		if (!this.isFeaturesChannel(message)) return;

		const embed = new RichEmbed()
			.setDescription(content)
			.setColor(0x8ed16c)
			.setTimestamp()
			.setAuthor(
				author.username,
				author.avatarURL
			);

		return Promise.all([
			message.delete(),
			channel
				.send(author, { embed })
				.then(message => message.react('👍')) //Ensure order
				.then(({ message }) => message.react('👎'))
				.then(({ message }) => message.react('❌'))
		]);
	}

	@on('messageReactionAdd')
	onReaction(reaction, user) {
		if (!this.isFeaturesChannel(reaction.message)) return;

		const embed = reaction.message.embeds[0];
		if (!embed) return;

		const sender = reaction.message.mentions.users.first();

		if (reaction.emoji.name === '❌' && sender === user)
			return reaction.message.delete();
	}

	isFeaturesChannel({ channel, guild }) {
		const sGuild = guild && settings.guilds.get(guild.id)
		return sGuild && sGuild.channels && channel.id == sGuild.channels.features;
	}
}
