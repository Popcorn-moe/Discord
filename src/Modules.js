import { commands } from './decorators/command'
import { listeners } from './decorators/on'

export const INSTANCE = Symbol();

export function loadModules(logger = () => {}) {
    Object.entries(require('./modules')).forEach(
        ([name, Module]) =>
        {
            logger(name)
            Module.prototype[INSTANCE] = new Module();
        });
}

export function unloadModules() {
    commands.clear();
    for (([event, list]) of listeners.entries()) {
        list.forEach((l) => discordClient.removeListener(event, l))
    }
}