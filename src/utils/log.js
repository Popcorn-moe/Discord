import { red, white, yellow } from 'chalk';
import * as embeds from './embeds';

export function error(e, message, ...args) {
	args.forEach(
		(arg, i) =>
			(message = message.replace('$' + i, '"' + white.bgRed(arg) + '"'))
	);
	console.error(red.bold(message));
	console.error(red.bold('Stack: ') + red((e && e.stack) || '' + e));
	console.error(red.italic.bold('Please fix me senpaiiii!'));
}

export function errorDiscord(channel, e, message, ...args) {
	error(e, message, ...args); //log to console

	args.forEach(
		(arg, i) => (message = message.replace('$' + i, '"' + arg + '"'))
	);

	//log to discord
	return channel
		.send(embeds.err(message).setDescription(e))
		.then(embeds.timeDelete)
		.catch(err =>
			error(
				err,
				'Error while displaying error message in discord channel $1',
				channel.id
			)
		);
}

export function warn(message, ...args) {
	args.forEach(
		(arg, i) =>
			(message = message.replace('$' + i, '"' + white.bgYellow(arg) + '"'))
	);
	console.warn(yellow.bold('Warning: ') + yellow(message));
	console.warn(yellow.italic.bold('Notice me, senpai <3'));
}

//Error handler
export function errHandle(fn, onErr) {
	return (...args) => {
		try {
			const promise = fn(...args);
			promise && promise.catch && promise.catch(e => onErr(e, ...args));
		} catch (e) {
			onErr(e, ...args);
		}
	};
}
