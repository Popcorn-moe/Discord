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

			return channel.send({ embed });
		});
	}

	@command(/^contributions(?: ([^ ]+))?$/i, {
		name: 'contributions',
		desc:
			"Afficher le leaderboard des contributions d'une organisation sur github pour les 7 derniers jours",
		usage: '[org]'
	})
	async contributions({ channel }, org = 'popcorn-moe') {
		const since = new Date(
			new Date().getTime() - 1000 * 60 * 60 * 24 * 7
		).toISOString();

		const {
			data: {
				organization: {
					login,
					avatarUrl,
					url,
					description,
					repositories: { nodes: repos }
				}
			}
		} = await this.graphql(
			`
        query ($org: String!, $since: GitTimestamp!){
					organization(login: $org) {
						login
						avatarUrl
						url
						description
						repositories(first: 100) {
							nodes {
								name
								ref(qualifiedName: "master") {
									target {
										... on Commit {
											id
											history(first: 100, since: $since) {
												nodes {
													author {
														name
													}
												}
											}
										}
									}
								}
							}
						}
					}
        }`,
			{ org, since }
		);

		const commits = repos
			.filter(repo => repo.ref)
			.map(repo => repo.ref.target.history.nodes)
			.reduce((acc, cur) => (acc = acc.concat(cur)), []) //merge repos
			.map(commit => commit.author.name)
			.reduce((acc, cur) => (acc[cur] = (acc[cur] || 0) + 1) && acc, {}); //count

		commits['SkyBeastMC'] -= 25;

		const sorted = Object.entries(commits).sort(([, n1], [, n2]) => n2 - n1);

		const embed = new RichEmbed()
			.setTitle(`Contributions des 7 derniers jours sur ${login}`)
			.setDescription(description)
			.setThumbnail(avatarUrl)
			.setURL(url);

		sorted.forEach(([author, commits], i) => embed.addField(`#${i + 1} - ${author}`, commits, true));

		channel.send({ embed });
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
