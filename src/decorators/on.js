import { INSTANCE } from '../Modules'
import { client } from '../discord'

export const listeners = new Map();

export default function on(event)
{
    return (target, key, descriptor) =>
    {
        if(!listeners.has(event))
            listeners.set(event, []);
        const listener = (...args) => descriptor.value.apply(target[INSTANCE], args);
        listeners.get(event).push(listener);
        client.on(event, listener);
        return descriptor;
    };
}