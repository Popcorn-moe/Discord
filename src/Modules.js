import { commands } from './decorators/command';
import { listeners } from './decorators/on';
import { client } from './discord';

export const INSTANCE = Symbol();

export function loadModules(logger = () => {}) {
	for ([name, Module] of Object.entries(require('./modules'))) {
		logger(name);
		Module.prototype[INSTANCE] = new Module();
	}
}

export function unloadModules() {
	commands.clear();
	for ([event, list] of listeners.entries()) {
		list.forEach(l => client.removeListener(event, l));
	}
}
