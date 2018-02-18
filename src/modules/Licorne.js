import { command } from '../decorators';
import { loadModules, unloadModules } from '../Modules';
import { blue, green } from 'chalk';

export default class Licorne {
	@command(/^reload$/)
	reload({ channel }) {
		unloadModules();
		// Clear cache
		Object.keys(require.cache)
			.filter(name => name.startsWith(__dirname))
			.forEach(key => delete require.cache[key]);
		const modules = [];
		loadModules(name => {
			modules.push(name);
			console.log(blue(`Reloading module ${green.bold(name)}!`));
		});

		channel.send(
			`\`\`\`Apache\n${modules
				.map(name => 'Reloading ' + name)
				.reduce((r, curr) => r + curr + '\n', '')}\`\`\``
		);
	}

	@command(/^echo (.+)$/)
	echo(message, msg) {
		message.reply(`\`\`\`${msg}\`\`\``);
	}
}
