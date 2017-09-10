import fs from 'fs';
import { Client } from 'discord.js';
import { blue, green, magenta } from 'chalk';

const client = global.discordClient = new Client();

client.on('ready', () =>
{
    console.log(magenta(`Moe Moe Kyun ${green.bold('@' + client.user.tag)}!`));
});

fs.readFile(__dirname + '/settings.json', (err, data) => { //load config first
    if (err) throw err;
    global.settings = JSON.parse(data);

    console.log(blue('Settings loaded.'));

    require('./src/Modules').loadModules((name) => console.log(blue(`Starting module ${green.bold(name)}!`)));
});

client.login(process.env.POPCORN_MOE_DISCORD_TOKEN);