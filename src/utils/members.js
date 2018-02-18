export function byID(guild, id) {
	return guild.members.find(({ id: _id }) => _id === id);
}

export function byName(guild, username, discriminator) {
	return guild.members.find(
		({ username: _u, discriminator: _d }) =>
			_u === username && _d === discriminator
	);
}
