import { RichEmbed } from 'discord.js';
import { on } from '../decorators';
import settings from '../../settings.json';
import { client } from '../discord';

export default class Features
{

	@on('ready')
	onReady()
	{
		settings.guilds.forEach(guild => {
			const channel = client.guilds
				.find(({ id }) => id == guild.id).channels
				.find(({ id }) => id == guild.channel.features);

			channel.fetchMessages(); //Allow the bot to listen to reactions in previous messages.
		});
	}

	@on('message')
	onMessage(message)
	{
		if (message.author === client.user) return;

		if (!this.isFeaturesChannel(message))
			return;

		message.delete();

		const embed = new RichEmbed()
			.setDescription(message.content)
			.setColor(0x8ed16c)
			.setTimestamp()
			.setAuthor(`${message.author.username} <${message.author.id}>`, message.author.avatarURL);

		message.channel.send({ embed })
			.then((message) => message.react('👍')) //Ensure order
			.then((react) => react.message.react('👎'))
			.then((react) => react.message.react('❌'));
	}

	@on('messageReactionAdd')
	onReaction(reaction, user)
	{
		if (!this.isFeaturesChannel(reaction.message))
			return;

		const embed = reaction.message.embeds[0];
		if (!embed) return;

		const id = /<(\d+)>/.exec(embed.author.name)[1]; //Get id in name

		if (reaction.emoji.name === '❌' && id === user.id)
			reaction.message.delete();
	}

	isFeaturesChannel({ channel, guild })
	{
		const sGuild = guild && settings.guilds.find(({ id }) => guild.id == id);
		return sGuild && channel.id == sGuild.channel.features;
	}
}
