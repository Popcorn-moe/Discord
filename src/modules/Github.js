import { command } from '../decorators';
import { RichEmbed } from 'discord.js';
import fetch from 'node-fetch';

export default class Github {
	constructor() {
		this.category = {
			icon: '<:github:357956053952102400>',
			name: 'Github'
		};
	}

	@command(/^github(?: ([^ ]+))?$/i, {
		name: 'github',
		desc: "Afficher les details d'une organisation sur github",
		usage: '[org]'
	})
	overview({ channel }, org = 'popcorn-moe') {
		return this.graphql(
			`
        query ($org: String!){
            organization(login: $org) {
              name
              description
              location
              url
              email
              avatarUrl
              privateRepos: repositories(privacy: PRIVATE) {
                totalCount
              }
              publicRepos: repositories(privacy: PUBLIC) {
                totalCount
              }
              pinnedRepositories(first: 5) {
                nodes {
                  name
                  url
                }
              }
            }
          }`,
			{ org }
		).then(({ data: { organization: data } }) => {
			const embed = new RichEmbed();
			embed.setTitle(data.name);
			embed.setDescription(data.description);
			embed.setThumbnail(data.avatarUrl);
			embed.setURL(data.url);
			if (data.location) embed.addField('Location', data.location);
			if (data.email) embed.addField('Email', data.email);
			embed.addField('Public Repos', data.publicRepos.totalCount, true);
			embed.addField('Private Repos', data.privateRepos.totalCount, true);
			if (data.pinnedRepositories.nodes.length) {
				let desc = `${data.description}\n\n**Pinned:**\n`;
				for (const pinned of data.pinnedRepositories.nodes) {
					desc += `- [${pinned.name}](${pinned.url})\n`;
				}
				embed.setDescription(desc);
			} else embed.setDescription(data.description);
			channel.send({ embed });
		});
	}

	graphql(query, variables) {
		return fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				authorization: `bearer ${process.env.GITHUB_TOKEN}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				query,
				variables
			})
		}).then(res => res.json());
	}
}
