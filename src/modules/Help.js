import { RichEmbed, command } from '@popcorn.moe/migi';

export default class Help {
	constructor(migi) {
		this.migi = migi;
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
		const sGuild = this.migi.settings.guilds.find(
			({ id }) => id === message.guild.id
		);
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
			.setImage(this.migi.settings.images.help)
			.setThumbnail(this.migi.settings.images.iconAnimated)
			.setColor(0x8ed16c)
			.setTimestamp()
			.setFooter('popcorn.moe', this.migi.settings.images.siteIcon);

		const categories = new Map();

		for (const module of this.migi.modules) {
			const category = module.category;
			if (!category) continue;
			if (!categories.has(category)) categories.set(category, []);
			for (const [
				,
				,
				{ name, usage = '', aliases = [], desc }
			] of this.migi._modules.get(module).commands) {
				categories.get(category).push({ name, usage, aliases, desc });
			}
		}

		Array.from(categories.entries())
			.sort(([a = {}], [b = {}]) => b.order || 0 - a.order || 0)
			.forEach(([{ icon, desc, name }, cmds]) =>
				embed.addField(
					`${icon || '▶'} **${name}** ${desc ? '- ' + desc : ''}`, // ▶ is an emoji
					cmds
						.map((cmd, i) => [cmd, i === cmds.length - 1])
						.map(
							([{ name, usage, aliases, desc }, last]) =>
								`${last ? '┗►' : '┣►'} **${
									this.migi.settings.prefix
								}${name} ${usage}**` +
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
