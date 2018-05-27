import { EventEmitter } from 'events'

export { default as Youtube } from './Youtube'

export class Provider extends EventEmitter {
	/**
	 * Check if an url match with the provider
	 * @param {string} url The url to check
	 * @returns {boolean}
	 */
	static isValid (url) {
		return false
	}

	constructor () {
		super()
	}

	/**
	 * Load the music stream
	 * @returns {Promise<ReadableStream|null>}
	 */
	get stream () {
		return Promise.resolve(null)
	}

	/**
	 * Provider color
	 * @returns {number}
	 */
	static get color () {
		return 0xBDBDBD
	}

	/**
	 * Get provider embed with music infos
	 * @returns {Promise<RichEmbed>}
	 */
	get embed () {
		const embed = new RichEmbed()
			.setTitle('Non configured provider')
			.setColor(this.color)

		return Promise.resolve(embed)
	}

	/**
	 * Result of a query
	 * @returns {Array<RichEmbed>}
	 */
}
