import Migi from '@popcorn.moe/migi';
import * as modules from './src/modules';
import { error } from './src/utils';

const migi = new Migi({
	root: __dirname,
	settings: {
		guilds: [
			{
				id: '349931957078982657',
				channels: {
					bots: '351839278906736641',
					features: '353230683575156736',
					suggestions: '363729034523312129'
				}
			}
		],
		images: {
			error: ['http://imgur.com/Kp5N5Ew.gif', 'http://imgur.com/FqaHIwS.gif'],
			help: 'http://imgur.com/xa7q1J7.png',
			icon: 'http://imgur.com/nhzDlUN.png',
			iconAnimated: 'http://imgur.com/UhfLaW5.gif',
			siteIcon: 'http://imgur.com/InRVZ2Q.png'
		}
	}
});

Object.values(modules).forEach(Module => migi.loadModule(Module));

migi.on('ready', () => console.log('Ready', migi.user.tag));

migi.login(process.env.DISCORD_TOKEN).catch(e => error(e, 'Login error!'));
