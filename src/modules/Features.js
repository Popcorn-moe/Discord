import { RichEmbed } from 'discord.js';
import { on } from '../decorators';
import settings from '../../settings.json';
import { client } from '../discord';

export default class Features {
	@on('ready')
	onReady() {
		return Promise.all(
			settings.guilds
				.map(sGuild => [
					client.guilds.find(({ id }) => id == sGuild.id),
					sGuild.channels.features
				])
				.map(([guild, sChannel]) =>
					guild.channels.find(({ id }) => id == sChannel)
				)
				.map(channel => channel.fetchMessages()) //Allow the bot to listen to reactions in previous messages.
		);
	}

	@on('message')
	onMessage(message) {
		if (message.author === client.user) return;

		if (!this.isFeaturesChannel(message)) return;

		const embed = new RichEmbed()
			.setDescription(message.content)
			.setColor(0x8ed16c)
			.setTimestamp()
			.setAuthor(
				`${message.author.username} <${message.author.id}>`,
				message.author.avatarURL
			);

		return Promise.all([
			message.delete(),
			message.channel
				.send({ embed })
				.then(message => message.react('👍')) //Ensure order
				.then(react => react.message.react('👎'))
				.then(react => react.message.react('❌'))
		]);
	}

	@on('messageReactionAdd')
	onReaction(reaction, user) {
		if (!this.isFeaturesChannel(reaction.message)) return;

		const embed = reaction.message.embeds[0];
		if (!embed) return;

		const id = /<(\d+)>/.exec(embed.author.name)[1]; //Get id in name

		if (reaction.emoji.name === '❌' && id === user.id)
			return reaction.message.delete();
	}

	isFeaturesChannel({ channel, guild }) {
		const sGuild = guild && settings.guilds.find(({ id }) => guild.id == id);
		return sGuild && channel.id == sGuild.channels.features;
	}
}
