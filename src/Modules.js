import { commands } from './decorators/command';
import { listeners } from './decorators/on';
import { client } from './discord';

export const INSTANCE = Symbol();

export function loadModules(logger = () => {}, dispatchReadyEvent = false) {
	for ([name, Module] of Object.entries(require('./modules'))) {
		logger(name);
		const instance = new Module();
		Module.prototype[INSTANCE] = instance;
		if (dispatchReadyEvent) dispatchEvent(instance, 'ready');
	}
}

export function dispatchEvent(module, event, ...args) {
	const listening = listeners.get(event);

	if (!listening) return; //No module is listening this event

	listening.filter(({ target }) => target[INSTANCE] === module)
		.forEach(listener => listener.listener(...args));
}

export function unloadModules() {
	commands.clear();
	for ([event, list] of listeners.entries()) {
		list.forEach(({ listener }) => client.removeListener(event, listener));
	}
}
