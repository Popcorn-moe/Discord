import Migi from '@popcorn.moe/migi'
import * as modules from './src/modules'
import { error, warn } from './src/utils'
import { blue, green, magenta } from 'chalk'

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
})

Object.entries(modules).forEach(([name, Module]) => {
	migi.loadModule(Module)
	console.log(blue(`Starting module ${green.bold(name)}!`))
})

migi.login(process.env.DISCORD_TOKEN).catch(e => error(e, 'Login error!'))

migi.on('ready', () =>
	console.log(magenta(`Moe Moe Kyun ${green.bold('@' + migi.user.tag)}!`))
)

//catch exits
process.on('exit', () => {
	migi.destroy()
})

//catch ctrl+c event and exit normally
process.on('SIGINT', () => {
	process.exit(2)
})

//catch uncaught exceptions, and exit normally
process.on('uncaughtException', err => {
	error(err, 'Uncaught exception... exiting program!')
	process.exit(99)
})

//catch rejected promises
process.on('unhandledRejection', err => {
	error(err, 'Unhandled promise rejection!')
})

//catch warnings
process.on('warning', warning => {
	warn(warning)
})
