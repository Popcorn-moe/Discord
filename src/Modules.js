import { commands } from './decorators/command'
import { listeners } from './decorators/on'
import * as modules from './modules'

export const INSTANCE = Symbol();

export function loadModules(logger = () => {}) {
    for (([name, Module]) of Object.entries(modules)) {
        logger(name)
        Module.prototype[INSTANCE] = new Module();
    }
}

export function unloadModules() {
    commands.clear();
    for (([event, list]) of listeners.entries()) {
        list.forEach((l) => discordClient.removeListener(event, l))
    }
}