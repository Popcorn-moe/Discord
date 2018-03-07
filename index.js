import { blue, green } from 'chalk';
import { client } from './src/discord';
import { loadModules } from './src/Modules';
import { error } from './src/utils';

loadModules(name => console.log(blue(`Starting module ${green.bold(name)}!`)));

client.login(process.env.POPCORN_MOE_DISCORD_TOKEN)
	.catch(e => error(e, 'Login error!'));
