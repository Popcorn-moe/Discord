import { yellow, white } from 'chalk';

export default function needPermissions(permissions, ...args) {
	return (target, key, descriptor) => {
		const wrapped = descriptor.value;
		descriptor.value = function(...fnargs) {
			//Wrap the function into another function
			const { member, author } = fnargs[0];

			if (member && member.hasPermission(permissions, ...args))
				return wrapped.apply(this, fnargs); //Pass the args & this value
			else
				console.log(
					yellow(
						`Not enough permissions for user "${white.bgYellow(
							`@${author.username}#${author.discriminator}`
						)}" (${white.bgYellow(`<@${author.id}>`)})!`
					)
				);
			return descriptor;
		};
	};
}
