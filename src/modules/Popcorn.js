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
