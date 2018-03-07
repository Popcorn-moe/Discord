import { Client } from 'discord.js';
import { magenta, green } from 'chalk';
import { error } from './utils'

export const client = new Client();

client.on('ready', () =>
	console.log(magenta(`Moe Moe Kyun ${green.bold('@' + client.user.tag)}!`))
);

process.on('exit', () => client.destroy());

// catch ctrl+c event and exit normally
process.on('SIGINT', () => process.exit(2));

//catch uncaught exceptions, trace, then exit normally
process.on('uncaughtException', e => {
	error(e, 'Uncaught exception... exiting program!')
	process.exit(99);
});
