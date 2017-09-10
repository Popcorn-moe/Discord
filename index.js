import { blue, green } from 'chalk';
import { client } from './src/discord';
import { loadModules } from './src/Modules'

loadModules((name) => console.log(blue(`Starting module ${green.bold(name)}!`)));

client.login(process.env.POPCORN_MOE_DISCORD_TOKEN);