import { INSTANCE, listeners } from '../Modules';
import { client } from '../discord';
import { red, white } from 'chalk';

export default function on(event) {
	return (target, key, descriptor) => {
		if (!listeners.has(event)) listeners.set(event, []);
		const name = `${target.constructor.name}.${key}`;

		const listener = (...args) => {
			try {
				descriptor.value.apply(target[INSTANCE], args);
			} catch (e) {
				console.log(red.bold('Something unexpected happened when dispatching event "' + white.bgRed(event) + '" to listener "'
					+ white.bgRed(name) + '"!'));
				console.log(red.bold('Stacktrace: ') + red(e ? e.stack : 'Error ' + e));
				console.log(red.italic.bold('Please fix me senpaiiii!'));
			}
		};
		listeners.get(event).push({ target, key, listener, name });
		client.on(event, listener);
		return descriptor;
	};
}
