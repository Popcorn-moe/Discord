import { command, needPermissions } from '../decorators';
import {
	loadModules,
	unloadModules,
	modules,
	listeners,
	commands
} from '../Modules';
import { blue, green } from 'chalk';
import stringify from 'stringify-object';
import { randomIn, load } from '../utils';
import { Permissions } from 'discord.js';

const settings = load('global.json');

export default class Licorne {
	@command(/^reload$/)
	@needPermissions(Permissions.FLAGS.MANAGE_GUILD)
	reload({ channel }) {
		unloadModules();
		const modules = [];
		loadModules(name => {
			modules.push(name);
			console.log(blue(`Reloading module ${green.bold(name)}!`));
		}, true);

		return channel.send(
			`\`\`\`Apache\n${modules
				.map(name => 'Reloading ' + name)
				.join('\n')}\`\`\``
		);
	}

	@command(/^licorne$/)
	licorne() {
		throw new Error(randomIn(settings.falseRealities));
	}

	@command(/^echo (.+)$/)
	@needPermissions(Permissions.FLAGS.MANAGE_GUILD)
	echo(message, msg) {
		return message.reply(`\`\`\`${msg}\`\`\``);
	}

	@command(/^modules$/)
	@needPermissions(Permissions.FLAGS.MANAGE_GUILD)
	modules({ channel }) {
		return channel.send(
			'Module list:\n' +
				`\`\`\`Apache\n${modules.map(({ name }) => name).join('\n')}\`\`\``
		);
	}

	@command(/^module (\w+)$/)
	@needPermissions(Permissions.FLAGS.MANAGE_GUILD)
	module({ channel }, module) {
		const mod = modules.find(mod => mod.name === module);
		if (!mod) return channel.send('Cannot find module ' + module + '.');

		const list = Array.from(listeners.entries())
			.reduce(
				(acc, [event, ls]) =>
					acc.concat(
						ls
							.filter(({ target }) => target.constructor.name === module)
							.map(({ name }) => `${event} ${name}`)
					),
				[]
			)
			.join('\n');
		const comm = Array.from(commands.entries())
			.filter(([regex, { target }]) => target.constructor.name === module)
			.map(([regex, { name }]) => `${regex} ${name}`)
			.join('\n');
		const prop = Object.entries(mod)
			.map(([k, v]) => `${module}.${k} = ${this.stringify(v)}`)
			.join('\n');

		return channel
			.send(`__Module **${module}**:__`)
			.then(({ channel }) =>
				channel.send(
					'> *Listeners*\n' + `\`\`\`Apache\n${list || 'None'}\`\`\``
				)
			)
			.then(({ channel }) =>
				channel.send('> *Commands*\n' + `\`\`\`Apache\n${comm || 'None'}\`\`\``)
			)
			.then(({ channel }) =>
				channel.send('> *Properties*\n' + `\`\`\`js\n${prop || 'None'}\`\`\``)
			);
	}

	stringify(obj) {
		let str = stringify(obj, {
			inlineCharacterLimit: 32,
			filter: (obj, prop) => typeof prop === 'string' && !prop.startsWith('_')
		}); //prevent Symbol and underscore props
		if (str.length > 500) {
			str = str.substring(0, 500);

			//ugly fix for quote mismatch
			const quoteCount = (str.match(/[^\\]'/g) || []).length;
			if ((str.match(/'/g) || []).length % 2) str += "[...]',";

			str += '\n\t[...]\n}';
		}
		return str;
	}
}
