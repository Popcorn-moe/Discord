import { red, white } from 'chalk';

export default function error(e, message, ...args) {
	args.forEach((arg, i) => message = message.replace('$' + i, '"' + white.bgRed(arg) + '"'));
	console.log(red.bold(message));
	console.log(red.bold('Stack: ') + red(e ? e.stack : 'Error ' + e));
	console.log(red.italic.bold('Please fix me senpaiiii!'));
}
