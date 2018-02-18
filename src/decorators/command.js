import { blue, green } from 'chalk';
import { INSTANCE } from '../Modules';
import { client } from '../discord';
import settings from '../../settings.json';

export const commands = new Map();

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
		.map(([regex, value]) => [
			regex.exec(
				value.options.prefix || true
					? msg.content.substring(PREFIX.length)
					: msg.content
			),
			value
		])
		.filter(([res]) => res !== null)
		.forEach(([result, { value, name, target }]) => {
			console.log(blue(`Executing ${green.bold(name)}.`));
			value.apply(target[INSTANCE], [msg].concat(result.slice(1)));
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
