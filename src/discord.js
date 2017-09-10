import { Client } from 'discord.js';
import { magenta, green } from 'chalk';

export const client = new Client();

client.on('ready', () => console.log(magenta(`Moe Moe Kyun ${green.bold('@' + client.user.tag)}!`)));