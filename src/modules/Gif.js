import settings from './Gif.json';
import command from '../decorators/command';
import { embeds, members, random } from '../utils';
import { RichEmbed } from 'discord.js';

const COMMAND_MATCH = '^$command(?: <@!?(\\d+)>| @(.+)#(\\d+))?';

export default class Gif {
	constructor() {
		this.category = {
			icon: '<:kannaChamp:358981430598041601>',
			name: 'GIF',
			desc: "Commandes basées sur l'envoi de gif"
		};

		this.setup();
	}

	setup() {
		Object.entries(settings).forEach(([name, cmd]) => this.setupOne(name, cmd));
	}

	setupOne(name, { desc, msg, gifs }) {
		const regex = new RegExp(COMMAND_MATCH.replace('$command', name), 'i');

		const value = (message, mention, name, id) => {
			message.delete();
			const { member, guild } = message;

			if (mention)
				this.response(message, msg, gifs, member, members.byID(guild, mention));
			else if (name)
				this.response(
					message,
					msg,
					gifs,
					member,
					members.byName(guild, name, id)
				);
			else this.response(message, msg, gifs, guild.me, member);
		};

		command(regex, { name, desc })(this, name, { value });
	}

	response(message, msg, gifs, from, to) {
		if (!to) {
			const embed = embeds.err('Aucun utilisateur trouvé 😭');

			message.channel
				.send({ embed })
				.then(message => embeds.timeDelete(message));
		}

		const send = msg
			.replace('{0}', from.displayName)
			.replace('{1}', to.displayName);

		const embed = new RichEmbed()
			.setTitle(send)
			.setColor(0x00ae86)
			.setImage(random(gifs));

		message.channel.send({ embed });
	}
}
