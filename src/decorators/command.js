import { blue, green } from 'chalk';
import { INSTANCE, commands } from '../Modules';
import { client } from '../discord';
import { error } from '../utils';
import settings from '../../settings.json';

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
		.forEach(([result, { value, name, target }]) => {
			console.log(blue(`Executing ${green.bold(name)}.`));
			try {
				const promise = value.apply(
					target[INSTANCE],
					[msg].concat(result.slice(1))
				);
				if (promise && promise.catch)
					promise.catch(e =>
						error(
							e,
							'Something unexpected happened after dispatching message $0 to command $1!',
							msg.content,
							name
						)
					);
			} catch (e) {
				error(
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
