import { command } from '../decorators';
import { RichEmbed } from 'discord.js';
import client from '../graphql';
import gql from 'graphql-tag';

export default class Popcorn {
	constructor() {
		this.category = {
			icon: '<:popcorn:422775941325127690>',
			name: 'Popcorn'
		};
	}

	@command(/^user(?: ([^ ]+))$/)
	user({ channel }, name) {
		client
			.query({
				query: gql`
					query($name: String!) {
						users: searchUser(name: $name, limit: 1) {
							login
							avatar
							group
							followers {
								login
							}
						}
					}
				`,
				variables: {
					name
				}
			})
			.then(({ data: { users } }) => {
				if (users.length === 0)
					return channel.send(
						new RichEmbed()
							.setAuthor(
								'Popcorn.moe',
								'https://popcorn.moe/static/logo.png',
								'https://popcorn.moe'
							)
							.addField('Error', 'User not found, try a better username.')
							.setColor(0xf6416c)
					);

				return Promise.all(
					users.map(user => {
						const followers = user.followers.length;
						const url = `https://popcorn.moe/user/${user.login}/profile`;
						const maxFollow = 6;

						const embed = new RichEmbed()
							.setURL(url)
							.setAuthor(user.login, user.avatar, url)
							.setThumbnail(user.avatar)
							.setColor(0xf6416c)
							.setTimestamp()
							.setFooter(
								'www.popcorn.moe',
								'https://popcorn.moe/static/logo.png'
							);

						let text = '';

						for (let i = 0; i < followers && i <= maxFollow; i++) {
							const login = user.followers[i].login;
							text += `**┣► [${login}](https://popcorn.moe/user/${login}/profile)**\n`;
						}

						if (followers > maxFollow) {
							text += `[Voir la liste complete ici.](https://popcorn.moe/user/${
								user.login
							}/followers)`;
						}

						if (followers !== 0) {
							embed.addField(`Follower(s) : ${followers}`, text, true);
						}

						embed.addField(
							'Rank',
							user.group[0].toUpperCase() + user.group.slice(1).toLowerCase(),
							true
						);

						return channel.send(embed);
					})
				);
			});
	}

	@command(/^anime(?: ([^ ]+))$/)
	anime({ channel }, name) {
		client
			.query({
				query: gql`
					query($name: String!) {
						animes: searchAnimes(name: $name, limit: 3) {
							id
							names
							status
							cover
							desc
							seasons {
								name
								episodes {
									name
								}
							}
							medias {
								type
								content
							}
						}
					}
				`,
				variables: {
					name
				}
			})
			.then(({ data: { animes } }) => {
				return animes.reduce((promise, anime) => {
					const url = `https://popcorn.moe/anime/${anime.id}`;
					const embed = new RichEmbed()
						.setTitle(anime.names[0])
						.setThumbnail(anime.cover)
						.setURL(url)
						.addField(
							'Names',
							anime.names.map(n => `*${n}*`).join('\u200C**,** ')
						)
						.addField(
							'Status',
							anime.status[0] + anime.status.slice(1).toLowerCase()
						);

					anime.seasons.forEach(({ name, episodes }, i) => {
						const eps = episodes.map(({ name }, j) => {
							return `**┣►  [${name}](${url}/${i + 1}/${j + 1})**`;
						});
						embed.addField(
							`Season ${i + 1}${name !== ' ' ? ': ' + name : ''}`,
							eps.join('\n')
						);
					});

					const trailers = anime.medias.filter(
						({ type }) => type === 'TRAILER'
					);

					embed
						.addField('Description', anime.desc)
						.setAuthor(
							'Popcorn.moe',
							'https://popcorn.moe/static/logo.png',
							'https://popcorn.moe'
						)
						.setColor(0xf6416c);
					return promise.then(() => channel.send(embed)).then(() => {
						if (trailers.length) {
							let trailer = trailers[0].content;
							if (trailer.startsWith('https://www.youtube.com/embed/')) {
								const ytId = trailer.slice(
									'https://www.youtube.com/embed/'.length
								);
								trailer = `https://www.youtube.com/watch?v=${ytId}`;
							}
							return channel.send(`**Trailer:**\t${trailer}`);
						}
					});
				}, Promise.resolve());
			});
	}
}
