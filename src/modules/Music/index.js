import { RichEmbed, command, on, configurable } from '@popcorn.moe/migi'
import {
	embeds,
	randomIn,
	error,
	warn,
	errHandle,
	errorDiscord
} from '../../utils'
import YoutubeStreamer from './YoutubeStreamer'
import SoundCloudStreamer from './SoundCloudStreamer'
import ListenMoeStreamer from './ListenMoeStreamer'

const STREAMERS = [YoutubeStreamer, SoundCloudStreamer, ListenMoeStreamer]

@configurable('music', {
	greets: [
		'./assets/moemoekyun.mp3',
		'./assets/niconiconi.mp3',
		'./assets/nyanpasu.mp3',
		'./assets/tuturu.mp3'
	]
})
export default class Music {
	constructor(migi, settings) {
		this.migi = migi
		this.guilds = new Map()
		this.category = {
			icon: '🎵', // :musical_note:
			name: 'Musiques',
			desc: 'Commandes relatives aux musiques'
		}
		this.settings = settings
	}

	@command(/^come$/i, {
		name: 'come',
		desc: 'Connecter le bot à votre channel'
	})
	async come({ id, member, channel }) {
		if (!member.voiceChannel)
			return channel
				.send({ embed: embeds.err("Vous n'êtes pas dans un channel!") })
				.then(msg => embeds.timeDelete(msg))

		this.guilds.set(channel.guild.id, { queue: [], volume: 0.1 })

		const connection = await member.voiceChannel.join()
		connection.playFile(randomIn(this.settings.greets), { volume: 0.75 })

		const embed = new RichEmbed()
			.setTitle(`Connecté sur ${connection.channel.name}!`)
			.setColor(0x3df75f) //Todo gif :)
		await channel.send({ embed })
	}

	@command(/^stop$/i, { name: 'stop', desc: 'Déconnecter le bot du salon' })
	stop({ channel }) {
		if (!channel.guild.voiceConnection)
			return channel
				.send({ embed: embeds.err("Le bot n'est connecté à aucun channel!") })
				.then(msg => embeds.timeDelete(msg))

		const embed = new RichEmbed().setTitle('Déconnecté.').setColor(0xdb1348) //Todo gif :)

		return Promise.all([
			channel.guild.voiceConnection.disconnect(),
			channel.send({ embed })
		])
	}

	@command(/^play (.+)$/i, {
		name: 'play',
		desc: 'Jouer la musique',
		usage: '[url | listen.moe]'
	})
	play({ member, channel }, url) {
		if (!channel.guild.voiceConnection)
			return channel
				.send({ embed: embeds.err("Le bot n'est connecté à aucun channel!") })
				.then(msg => embeds.timeDelete(msg))

		const Streamer = STREAMERS.find(s => s.isValid(url))
		if (!Streamer)
			return channel
				.send({ embed: embeds.err('Je ne comprends pas cet url') })
				.then(msg => embeds.timeDelete(msg))

		const streamer = new Streamer(member, url)

		const { queue } = this.guildCache(channel.guild.id)
		queue.push(streamer)

		if (queue.length - 1) {
			return streamer.embed.then(embed => {
				channel.send(
					`🎵  Ajouté à la queue (ajouté par ${
						streamer.adder.displayName
					})  🎵`,
					{ embed }
				)
			})
		} else {
			return this.next({ channel }, true)
		}
	}

	@command(/^next$/i, { name: 'next', desc: 'Joue la musique suivante' })
	next({ channel }, auto = false) {
		const { queue, volume } = this.guildCache(channel.guild.id)

		if (!queue)
			return channel
				.send({ embed: embeds.err("Le bot n'est connecté à aucun channel!") })
				.then(msg => embeds.timeDelete(msg))

		if (
			channel.guild.voiceConnection &&
			channel.guild.voiceConnection.dispatcher
		)
			channel.guild.voiceConnection.dispatcher.end('next')

		const streamer = queue[0]

		if (!streamer)
			return auto
				? this.migi.user.setGame('')
				: channel
						.send({ embed: embeds.err("Il n'y a plus de musique à jouer!") })
						.then(msg => embeds.timeDelete(msg))

		streamer.on('music', () => {
			streamer.title
				.then(title => this.migi.user.setGame('🎵 ' + title))
				.catch(err => errorDiscord(channel, err, 'Streamer error'))
			streamer.embed
				.then(embed =>
					channel.send(
						`🎵  Actuellement joué (ajouté par ${
							streamer.adder.displayName
						})  🎵`,
						{ embed }
					)
				)
				.then(message =>
					this.buttons(
						message,
						['⏮', '⏹', '⏭', '⏸'],
						reaction => {
							//todo previous
							const { emoji } = reaction

							if (emoji.name === '⏹')
								return Promise.all([
									this.clearReaction(reaction),
									this.stop(message)
								])

							if (emoji.name === '⏭')
								return Promise.all([
									this.clearReaction(reaction),
									this.next(message)
								])

							if (!'⏸▶'.includes(emoji)) return this.clearReaction(reaction)

							const pause = emoji.name === '⏸'
							return Promise.all([
								this.clearReaction(reaction, null),
								this.pause(reaction.message, pause),
								reaction.message.react(pause ? '▶' : '⏸')
							])
						},
						['⏮', '⏹', '⏭', '⏸', '▶']
					)
				)
				.catch(err => errorDiscord(channel, err, 'Streamer error'))
		})

		return streamer.stream.then(stream => {
			const handler = channel.guild.voiceConnection.playStream(stream, {
				volume
			})

			handler.once(
				'end',
				errHandle(
					reason => {
						queue.shift()

						if (reason !== 'next') return this.next({ channel }, true)
					},
					err => errorDiscord(channel, err, 'Error when playing the next music')
				)
			)

			//Event handling
			handler.on('error', err =>
				errorDiscord(channel, err, 'Unexpected error on module Music')
			)

			handler.on('warn', warning => warn(warning))
		})
	}

	@command(/^skip(?: (\d+))?$/i, {
		name: 'skip',
		desc: 'Sauter n musiques de la liste',
		usage: '[n]'
	})
	skip({ channel }, num = 1) {
		if (
			!channel.guild.voiceConnection ||
			!channel.guild.voiceConnection.dispatcher
		)
			return channel
				.send({ embed: embeds.err('Le bot ne joue actuellement pas!') })
				.then(msg => embeds.timeDelete(msg))

		const { queue } = this.guildCache(channel.guild.id)

		const embed = new RichEmbed()
			.setTitle(`${queue.length < num ? queue.length : num} musiques passées`)
			.setColor(0xeaf73d) //Todo gif :)

		queue.splice(0, num - 1)

		channel.guild.voiceConnection.dispatcher.end()

		return channel.send({ embed })
	}

	@command(/^queue$/i, {
		name: 'queue',
		desc: 'Affiche les musiques dans la queue'
	})
	showQueue({ channel }) {
		const { queue } = this.guildCache(channel.guild.id)
		if (!queue)
			return channel
				.send({ embed: embeds.err('Le bot ne joue actuellement pas!') })
				.then(msg => embeds.timeDelete(msg))

		if (!queue.length) {
			const embed = new RichEmbed()
				.setTitle(`Il n'y a pas de musique dans la queue.`)
				.setColor(0xeaf73d) //Todo gif :)
			return channel.send({ embed })
		}

		channel.send('🎵  Liste des musiques dans la queue  🎵')

		return Promise.all(
			queue.map(streamer => streamer.embed.then(embed => [streamer, embed]))
		).then(p =>
			Promise.all(
				p.map(([streamer, embed], i) =>
					channel.send(
						i
							? `⏩  ${i}. Ajouté par ${streamer.adder.displayName}`
							: `▶  Actuellement joué (ajouté par ${
									streamer.adder.displayName
							  })`,
						{ embed }
					)
				)
			)
		)
	}

	@command(/^volume(?: (\d+)%?)?$/i, {
		name: 'volume',
		desc: 'Change le volume du bot (0 - 250)',
		usage: '[volume]'
	})
	volume({ channel }, percent) {
		if (!channel.guild.voiceConnection)
			return channel
				.send({ embed: embeds.err("Le bot n'est connecté à aucun channel!") })
				.then(msg => embeds.timeDelete(msg))

		if (percent < 0 || percent > 250)
			return channel
				.send({
					embed: embeds.err(
						'Impossible de définir le volume dans cet intervale'
					)
				})
				.then(msg => embeds.timeDelete(msg))

		const dispatcher = channel.guild.voiceConnection.dispatcher

		const reactionListener = reaction => {
			//todo mute
			const { emoji } = reaction

			const voiceConnection = message.channel.guild.voiceConnection
			const dispatcher = voiceConnection && voiceConnection.dispatcher
			const { volume } = this.guildCache(message.guild.id)

			const up = emoji.name === '🔊'

			return Promise.all([
				message.delete(),
				this.volume(reaction.message, volume * 100 - 10)
			])
		}

		if (percent) {
			this.guildCache(channel.guild.id).volume = percent / 100
			if (dispatcher) dispatcher.setVolume(percent / 100)

			const embed = new RichEmbed()
				.setTitle(`Le volume est maintenant à ${percent}%!`)
				.setColor(0xeaf73d) //Todo gif :)

			return channel
				.send({ embed })
				.then(message =>
					this.buttons(message, ['🔇', '🔉', '🔊'], reactionListener)
				)
		} else {
			const { volume } = this.guildCache(channel.guild.id)

			const embed = new RichEmbed()
				.setTitle(`Le volume est à ${(volume * 100).toFixed(0)}%!`)
				.setColor(0xeaf73d) //Todo gif :)

			return channel
				.send({ embed })
				.then(message =>
					this.buttons(message, ['🔇', '🔉', '🔊'], reactionListener)
				)
		}
	}

	@command(/^clearQueue$/i, { name: 'clearQueue', desc: 'Vide la queue' })
	clearQueue({ channel }) {
		this.guildCache(channel.guild.id).queue = []

		channel.guild.voiceConnection &&
			channel.guild.voiceConnection.dispatcher &&
			channel.guild.voiceConnection.dispatcher.end() //beautiful

		const embed = new RichEmbed()
			.setTitle('La queue a été vidée.')
			.setColor(0xeaf73d) //Todo gif :)
		return channel.send({ embed })
	}

	@command(/^pause$/i, { name: 'pause', desc: 'Met en pause la musique' })
	pause({ channel }, bool) {
		const dispatcher =
			channel.guild.voiceConnection && channel.guild.voiceConnection.dispatcher
		if (!dispatcher)
			return channel
				.send({ embed: embeds.err('Le bot ne joue actuellement pas!') })
				.then(msg => embeds.timeDelete(msg))

		dispatcher.setPaused(typeof bool === 'boolean' ? bool : !dispatcher.paused)

		const embed = new RichEmbed()
			.setTitle(dispatcher.paused ? '⏸  Pause' : '▶  Repris')
			.setColor(dispatcher.paused ? 0xeaf73d : 0x3df75f) //Todo gif :)
		return channel.send({ embed })
	}

	@command(/^removeMusic(?: (\d+))?$/i, {
		name: 'removeMusic',
		desc: 'Supprime un element de la queue à un index',
		usage: '[index]'
	})
	removeMusic({ channel }, num) {
		const { queue } = this.guildCache(channel.guild.id)
		if (!queue)
			return channel
				.send({ embed: embeds.err('Le bot ne joue actuellement pas!') })
				.then(msg => embeds.timeDelete(msg))

		if (!num)
			return channel
				.send({
					embed: embeds.err(
						'Veuillez donner un emplacement de musique de la queue.'
					)
				})
				.then(msg => embeds.timeDelete(msg))

		const embed = new RichEmbed()
			.setTitle(`Musique supprimée de la queue`)
			.setColor(0xeaf73d) //Todo gif :)

		queue.splice(num - 1, num)

		return channel.send({ embed })
	}

	buttons(message, reactions, fn, reactionListen = reactions) {
		const collector = message.createReactionCollector(
			(reaction, user) =>
				!user.bot && reactionListen.includes(reaction.emoji.name),
			{ time: 5 * 60 * 1000 }
		)
		collector.on(
			'collect',
			errHandle(fn, err =>
				errorDiscord(
					message.channel,
					err,
					'Unexpected error when collecting reactions'
				)
			)
		)

		return this.react(message, reactions).then(() => collector)
	}

	//Returns Promise<Array<Reaction>>
	react(message, emojis) {
		const [promise, reactions] = emojis.reduce(
			([promise, reactions], emoji) => [
				promise
					.then(() => message.react(emoji))
					.then(react => reactions.push(react)),
				reactions
			],
			[Promise.resolve(), []]
		)

		return promise.then(() => reactions)
	}

	clearReaction(reaction, filter = user => !user.bot) {
		return Promise.all(
			reaction.users
				.filterArray(filter || (() => true))
				.map(user => reaction.remove(user))
		)
	}

	guildCache(id) {
		let o = this.guilds.get(id)
		if (!o) {
			o = {}
			this.guilds.set(id, o)
		}
		return o
	}
}
