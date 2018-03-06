import { client } from './discord';

export const INSTANCE = Symbol();

export const modules = [];
export const commands = new Map();
export const listeners = new Map();

export function loadModules(logger = () => {}, dispatchReadyEvent = false) {
	for ([name, Module] of Object.entries(require('./modules/'))) {
		logger(name);

		const instance = new Module();
		Module.prototype[INSTANCE] = instance;
		instance.name = Module.name;

		if (dispatchReadyEvent) dispatchEvent(instance, 'ready');

		modules.push(instance);
	}
}

export function dispatchEvent(module, event, ...args) {
	const listening = listeners.get(event);

	if (!listening) return; //No module is listening this event

	listening.filter(({ target }) => target[INSTANCE] === module)
		.forEach(listener => listener.listener(...args));
}

export function unloadModules() {
	modules.clear();
	commands.clear();
	for ([event, list] of listeners.entries()) {
		list.forEach(({ listener }) => client.removeListener(event, listener));
	}

	// Clear cache
	Object.keys(require.cache)
		.filter(name => name.startsWith(__dirname))
		.forEach(key => delete require.cache[key]);
}
