import { blue, green } from 'chalk';
import { INSTANCE, commands } from '../Modules';
import { client } from '../discord';
import { errorDiscord, load } from '../utils';

const settings = load('global.json');

const PREFIX = settings.prefix;

client.on('message', msg => {
	Array.from(commands.entries())
		.filter(
			([_, { options: { allowPrivate = false } }]) => allowPrivate || msg.guild
		)
		.filter(
			([_, { options: { prefix = true } }]) =>
				!prefix || msg.content.startsWith(PREFIX)
		)
		.map(([regex, value]) => {
			const content = value.options.clean ? msg.cleanContent : msg.content;
			return [
				regex.exec(
					value.options.prefix || true
						? content.substring(PREFIX.length)
						: content
				),
				value
			];
		})
		.filter(([res]) => res !== null)
		.forEach(async ([result, { value, name, target }]) => {
			console.log(blue(`Executing ${green.bold(name)}.`));
			try {
				await value.apply(
					target[INSTANCE],
					[msg].concat(result.slice(1))
				);
			} catch (e) {
				errorDiscord(
					msg.channel,
					e,
					'Something unexpected happened when dispatching message $0 to command $1!',
					msg.content,
					name
				);
			}
		});

	for (const regex of commands.keys()) {
		regex.lastIndex = 0;
	}
});

export default function command(regex, options = {}) {
	return (target, key, descriptor) => {
		commands.set(regex, {
			name: `${target.constructor.name}.${key}`,
			target,
			value: descriptor.value,
			options
		});
		return descriptor;
	};
}
