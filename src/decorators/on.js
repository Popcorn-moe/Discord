import { INSTANCE } from '../Modules';
import { client } from '../discord';
import { red, white } from 'chalk';

export const listeners = new Map();

export default function on(event) {
	return (target, key, descriptor) => {
		if (!listeners.has(event)) listeners.set(event, []);
		const listener = (...args) => {
			try {
				descriptor.value.apply(target[INSTANCE], args);
			} catch (e) {
				console.log(red.bold('Something unexpected happened when dispatching event "' + white.bgRed(event) + '" to listener "'
					+ white.bgRed(`${target.constructor.name}.${key}`) + '"!'));
				console.log(red.bold('Stacktrace: ') + red(e ? e.stack : 'Error ' + e));
				console.log(red.italic.bold('Please fix me senpai'));
			}
		}
		listeners.get(event).push({ target, key, listener });
		client.on(event, listener);
		return descriptor;
	};
}
