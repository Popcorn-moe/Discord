import { INSTANCE } from '../Modules'

export const listeners = new Map();

export default function on(event)
{
    return (target, key, descriptor) =>
    {
        if(!listeners.has(event))
            listeners.set(event, []);
        const listener = (...args) => descriptor.value.apply(target[INSTANCE], args);
        listeners.get(event).push(listener);
        global.discordClient.on(event, listener);
        return descriptor;
    };
}