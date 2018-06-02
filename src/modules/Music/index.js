import { RichEmbed, command, on, configurable } from '@popcorn.moe/migi'
import {
	embeds,
	randomIn,
	error,
	warn,
	errHandle,
	errorDiscord
} from '../../utils'
import fs from 'fs'
import Queue from 'p-queue'
import uuid from 'uuid/v4'

import { Provider } from './Providers'
import { Youtube } from './Providers/All'

const PROVIDERS = [Youtube]

//import YoutubeStreamer from './YoutubeStreamer'
//import SoundCloudStreamer from './SoundCloudStreamer'
//import ListenMoeStreamer from './ListenMoeStreamer'
//
//const STREAMERS = [YoutubeStreamer, SoundCloudStreamer, ListenMoeStreamer]

// TODO: Return a cancelable promise using p-cancelable
const music = (stream, connection) => new Promise(resolve => connection.playStream(stream).on('end', () => resolve()))

const createQueue = () => ({
	queue: new Queue({ concurrency: 1, autoStart: true }),
	tracks: []
})

const addTrack = ({ queue, tracks }, connection, provider) => {
	const trackId = uuid()

	const task = () => new Promise(async resolve => {
		return connection.playStream(await provider.stream).on('end', resolve)
	})

	tracks.push({
		trackId,
		provider
	})

	queue.add(task)
		.then(() => tracks.splice(tracks.findIndex(track => track.trackId == trackId), 1))
}

const removeTrack = ({ queue, tracks }, id) => {
	const index = tracks.findIndex(track => track.trackId == id)

	if (index) {
		tracks.splice(index, 1)
		queue.queue._queue.splice(index, 1)
	}
}

@configurable('music', {
	greets: [
		'./assets/moemoekyun.mp3',
		'./assets/niconiconi.mp3',
		'./assets/nyanpasu.mp3',
		'./assets/tuturu.mp3'
	]
})
export default class Music {
	constructor (migi, settings) {
		Object.assign(this, {
			migi,
			settings,
			guilds: new Map(),
			category: {
				icon: '🎵', // :musical_note:
				name: 'Musiques',
				desc: 'Commandes relatives aux musiques'
			}
		})
	}

	@command(/^come$/i, {
		name: 'come',
		desc: 'Connecter le bot à votre salon'
	})
	async come ({ id, member, channel }) {
		if (!member.voiceChannel) {
			return channel.send({ embed: embeds.err('Vous n\'êtes dans aucun salon') })
				.then(message => embeds.timeDelete(message))
		}

		const queue = createQueue()
		const connection = await member.voiceChannel.join()
		this.guilds.set(channel.guild.id, { queue, connection })

		const greeter = randomIn(this.settings.greets)
		const greeting = queue.queue.add(() => music(fs.createReadStream(greeter), connection))

		queue.queue.onEmpty().then(() => console.debug('queue empty'))
		queue.queue.onIdle().then(() => console.debug('queue idle'))

		const embed = new RichEmbed()
			.setTitle(`Connecté sur ${connection.channel.name}!`)
			.setColor(0x3df75f)

		return Promise.all([
			greeting,
			channel.send({ embed })
		])
	}

	@command(/^stop$/i, {
		name: 'stop',
		desc: 'Déconnecter le bot du salon'
	})
	stop({ channel }) {
		if (!channel.guild.voiceConnection) {
			return channel.send({ embed: embeds.err("Le bot n'est connecté à aucun channel!") })
				.then(message => embeds.timeDelete(message))
		}

		const embed = new RichEmbed()
			.setTitle('Déconnecté.')
			.setColor(0xdb1348)

		const { queue, connection } = this.guilds.get(channel.guild.id)

		queue.queue.clear()
		this.guilds.delete(channel.guild.id)

		return Promise.all([
			connection.disconnect(),
			channel.send({ embed })
		])
	}

	@command(/^play (.+)$/i, {
		name: 'play',
		desc: 'Jouer la musique',
		usage: '[url | listen.moe]'
	})
	play({ member, channel }, url) {
		if (!channel.guild.voiceConnection) {
			return channel.send({ embed: embeds.err("Le bot n'est connecté à aucun channel!") })
				.then(msg => embeds.timeDelete(msg))
		}

		const Provider = PROVIDERS.find(provider => provider.isValid(url))
		if (!Provider) {
			return channel
				.send({ embed: embeds.err('Je ne comprends pas cet url') })
				.then(msg => embeds.timeDelete(msg))
		}

		const content = new Provider(member, url)
		const { queue, connection } = this.guilds.get(channel.guild.id)

		addTrack(queue, connection, content)

		return content.embed.then(embed => channel.send({ embed }))
	}

	@command(/^next$/i, {
		name: 'next',
		desc: 'Joue la musique suivante'
	})
	next({ channel }, auto = false) {
		const { queue, connection } = this.guilds.get(channel.guild.id)

		if (!queue.queue) {
			return channel.send({ embed: embeds.err("Le bot n'est connecté à aucun channel!") })
				.then(msg => embeds.timeDelete(msg))
		}

		if (connection && connection.dispatcher) {
			connection.dispatcher.end('next')
		}
//		const streamer = queue[0]
//
//		if (!streamer)
//			return auto
//				? this.migi.user.setGame('')
//				: channel
//						.send({ embed: embeds.err("Il n'y a plus de musique à jouer!") })
//						.then(msg => embeds.timeDelete(msg))
//
//		streamer.on('music', () => {
//			streamer.title
//				.then(title => this.migi.user.setGame('🎵 ' + title))
//				.catch(err => errorDiscord(channel, err, 'Streamer error'))
//			streamer.embed
//				.then(embed =>
//					channel.send(
//						`🎵  Actuellement joué (ajouté par ${
//							streamer.adder.displayName
//						})  🎵`,
//						{ embed }
//					)
//				)
//				.then(message =>
//					this.buttons(
//						message,
//						['⏮', '⏹', '⏭', '⏸'],
//						reaction => {
//							//todo previous
//							const { emoji } = reaction
//
//							if (emoji.name === '⏹')
//								return Promise.all([
//									this.clearReaction(reaction),
//									this.stop(message)
//								])
//
//							if (emoji.name === '⏭')
//								return Promise.all([
//									this.clearReaction(reaction),
//									this.next(message)
//								])
//
//							if (!'⏸▶'.includes(emoji)) return this.clearReaction(reaction)
//
//							const pause = emoji.name === '⏸'
//							return Promise.all([
//								this.clearReaction(reaction, null),
//								this.pause(reaction.message, pause),
//								reaction.message.react(pause ? '▶' : '⏸')
//							])
//						},
//						['⏮', '⏹', '⏭', '⏸', '▶']
//					)
//				)
//				.catch(err => errorDiscord(channel, err, 'Streamer error'))
//		})
//
//		return streamer.stream.then(stream => {
//			const handler = channel.guild.voiceConnection.playStream(stream, {
//				volume
//			})
//
//			handler.once(
//				'end',
//				errHandle(
//					reason => {
//						queue.shift()
//
//						if (reason !== 'next') return this.next({ channel }, true)
//					},
//					err => errorDiscord(channel, err, 'Error when playing the next music')
//				)
//			)
//
//			//Event handling
//			handler.on('error', err =>
//				errorDiscord(channel, err, 'Unexpected error on module Music')
//			)
//
//			handler.on('warn', warning => warn(warning))
//		})
	}

	@command(/^queue$/i, {
		name: 'queue',
		desc: 'Affiche les musiques dans la queue'
	})
	showQueue({ channel }) {
		const { queue } = this.guilds.get(channel.guild.id)

		if (!queue.tracks) {
			return channel
				.send({ embed: embeds.err('Le bot ne joue actuellement pas!') })
				.then(msg => embeds.timeDelete(msg))
		}

		if (!queue.tracks.length) {
			const embed = new RichEmbed()
				.setTitle(`Il n'y a pas de musique dans la queue.`)
				.setColor(0xeaf73d) //Todo gif :)
			return channel.send({ embed })
		}

		console.log(queue.queue.queue._queue.length)
		console.log(queue.queue.queue._queue)

		console.log(queue.tracks.length)

		const embeds = queue.tracks.map(async ({ provider }) => [provider, await provider.embed])

		return Promise.all(embeds)
			.then(embeds => embeds.map(([provider, embed], index) => embed.setDescription(`${index || 'En cours'} • Ajouté par ${provider.sender.displayName}`)))
			.then(embeds => embeds.map(embed => channel.send({ embed })))
			.then(messages => Promise.all(messages))
	}
}

/*

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
	volume(message, percent) {

		const { channel, guild } = message;

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

			const voiceConnection = channel.guild.voiceConnection
			const dispatcher = voiceConnection && voiceConnection.dispatcher
			const { volume } = this.guildCache(guild.id)

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
*/
