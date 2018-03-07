import { Client } from 'discord.js';
import { magenta, green } from 'chalk';
import { error, warn } from './utils'

export const client = new Client();

client.on('ready', () =>
	console.log(magenta(`Moe Moe Kyun ${green.bold('@' + client.user.tag)}!`))
);

//catch exits
process.on('exit', () => {
	 client.destroy()	;
});

//catch ctrl+c event and exit normally
process.on('SIGINT', () => {
	process.exit(2);
});

//catch uncaught exceptions, and exit normally
process.on('uncaughtException', err => {
	error(err, 'Uncaught exception... exiting program!');
	process.exit(99);
});

//catch rejected promises
process.on('unhandledRejection', err => {
	error(err, 'Unhandled promise rejection!');
});

//catch warnings
process.on('warning', warning => {
	warn(warning);
})
