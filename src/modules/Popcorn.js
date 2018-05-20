import { command, RichEmbed } from '@popcorn.moe/migi';
import client from '../graphql';
import gql from 'graphql-tag';

import { escape } from 'querystring';
import { embeds, load } from '../utils';

export default class Popcorn {
	constructor() {
		this.category = {
			icon: '<:popcorn:422775941325127690>',
			name: 'Popcorn'
		};
	}

	@command(/^user(?: ([^ ]+))$/, {
		name: 'user',
		desc: "Afficher les details d'un utilisateur de Popcorn.Moe",
		usage: '[utilisateur]'
	})
	async user({ channel }, name) {
		const {
			data: { users }
		} = await client.query({
			query: gql`
				query($name: String!) {
					users: searchUser(name: $name, limit: 1) {
						login
						avatar
						group
						followers {
							login
						}
						follows {
							login
						}
					}
				}
			`,
			variables: {
				name
			}
		});
		if (users.length === 0)
			return channel.send({
				embed: embeds.err('User not found, try a better username.')
			});

		await Promise.all(
			users.map(user => {
				const url = `https://popcorn.moe/user/${user.login}/profile`;
				const maxSize = 6;

				const embed = new RichEmbed()
					.setURL(url)
					.setAuthor(user.login, user.avatar, url)
					.setThumbnail(user.avatar)
					.setColor(0xf6416c)
					.setTimestamp()
					.setFooter('popcorn.moe', 'https://popcorn.moe/static/logo.png');

				if (user.followers.length !== 0) {
					embed.addField(
						`Follower(s) : ${user.followers.length}`,
						this.getText(user.followers, 'followers', user, maxSize),
						true
					);
				}

				if (user.follows.length !== 0) {
					embed.addField(
						`Follow(s) : ${user.follows.length}`,
						this.getText(user.follows, 'follows', user, maxSize),
						true
					);
				}

				embed.addField(
					'Rank',
					user.group[0].toUpperCase() + user.group.slice(1).toLowerCase(),
					true
				);

				return channel.send({ embed });
			})
		);
	}

	getText(array, message, user, maxSize) {
		let text = '';

		if (array.length <= maxSize) {
			text = array
				.map(
					({ login }) =>
						`**┣► [${login.replace(
							/(\[|\])/g,
							'\\$1'
						)}](https://popcorn.moe/user/${escape(login).replace(
							/(\(|\))/g,
							'\\$1'
						)}/profile)**`
				)
				.join('\n');
		}

		if (array.length > maxSize) {
			text += `\n[**See the list here.**](https://popcorn.moe/user/${
				user.login
			}/${message})`;
		}

		return text;
	}

	@command(/^anime(?: ([^ ]+))$/, {
		name: 'anime',
		desc: "Afficher les details d'un anime sur Popcorn.Moe",
		usage: '[anime]'
	})
	async anime({ channel }, name) {
		const {
			data: { animes }
		} = await client.query({
			query: gql`
				query($name: String!) {
					animes: searchAnimes(name: $name, limit: 3) {
						id
						names
						status
						cover {
							normal
						}
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
		});

		await animes.reduce(
			(promise, anime) =>
				promise.then(async () => {
					const url = `https://popcorn.moe/anime/${anime.id}`;
					const embed = new RichEmbed()
						.setTitle(anime.names[0])
						.setThumbnail(anime.cover.normal)
						.setURL(url)
						.setColor(0xf6416c)
						.setTimestamp()
						.setFooter('popcorn.moe', 'https://popcorn.moe/static/logo.png')
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

					embed.addField('Description', anime.desc);

					await channel.send({ embed });

					if (trailers.length) {
						let trailer = trailers[0].content;
						if (trailer.startsWith('https://www.youtube.com/embed/')) {
							const ytId = trailer.slice(
								'https://www.youtube.com/embed/'.length
							);
							trailer = `https://www.youtube.com/watch?v=${ytId}`;
						}
						await channel.send(`**Trailer:**\t${trailer}`);
					}
				}),
			Promise.resolve()
		);
	}
}
