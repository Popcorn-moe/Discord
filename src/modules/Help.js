import { RichEmbed } from 'discord.js';
import { command } from '../decorators';
import { load } from '../utils';
import { INSTANCE, commands } from '../Modules';

const { prefix, guilds } = load('global.json');

export default class Help {
	constructor() {
		this.category = {
			order: 10,
			icon: '❓',
			name: 'Aide'
		};
	}

	@command(/^help$/, {
		name: 'help',
		desc: "Afficher une page d'aide à propos d'une commande"
	})
	help(message) {
		const sGuild = guilds.find(({ id }) => id === message.guild.id);
		const botsChannel =
			sGuild &&
			sGuild.channels &&
			message.guild.channels.get(sGuild.channels.bots);

		const { author } = message;

		if (!this.embed) this.embed = this.generateHelp();

		return Promise.all([
			message.delete(),
			(botsChannel || author).send(author, { embed: this.embed })
		]);
	}

	generateHelp() {
		const embed = new RichEmbed()
			.setTitle('Commandes :')
			.setImage(settings.images.help)
			.setThumbnail(settings.images.iconAnimated)
			.setColor(0x8ed16c)
			.setTimestamp()
			.setFooter('www.popcorn.moe', settings.images.siteIcon);

		const categories = Array.from(commands.values())
			.map(({ target, options }) => [target[INSTANCE], options])
			.filter(([category, { name }]) => category && name)
			.reduce(
				(categories, [category, { name, usage = '', aliases = [], desc }]) => {
					if (!categories.has(category)) categories.set(category, []);
					categories.get(category).push({ name, usage, aliases, desc });

					return categories;
				},
				new Map()
			);

		Array.from(categories.entries())
			.sort(([a = {}], [b = {}]) => b.order || 0 - a.order || 0)
			.forEach(([{ icon, desc, name }, cmds]) =>
				embed.addField(
					`${icon || '▶'} **${name}** ${desc ? '- ' + desc : ''}`, // ▶ is an emoji
					cmds
						.map((cmd, i) => [cmd, i === cmds.length - 1])
						.map(
							([{ name, usage, aliases, desc }, last]) =>
								`${last ? '┗►' : '┣►'} **${prefix}${name} ${usage}**` +
								(aliases.length
									? ' [*alias: ' + aliases.join(', ') + '*]\n'
									: '\n') +
								(desc ? `${last ? '     ' : '┃ '}     ╰> *${desc}*\n` : '')
						)
						.join('┃\n')
				)
			);

		return embed;
	}
}
