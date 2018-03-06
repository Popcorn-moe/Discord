import { INSTANCE, listeners } from '../Modules';
import { client } from '../discord';
import { error } from '../utils';

export default function on(event) {
	return (target, key, descriptor) => {
		if (!listeners.has(event)) listeners.set(event, []);
		const name = `${target.constructor.name}.${key}`;

		const listener = (...args) => {
			try {
				const promise = descriptor.value.apply(target[INSTANCE], args)
				if (promise && promise.catch)
					promise.catch(e => error(e, 'Something unexpected happened after dispatching event $0 to listener $1!', event, name));
			} catch (e) {
				error(e, 'Something unexpected happened when dispatching event $0 to listener $1!', event, name);
			}
		};
		listeners.get(event).push({ target, key, listener, name });
		client.on(event, listener);
		return descriptor;
	};
}
