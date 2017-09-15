import ytdl from 'ytdl-core';
import { RichEmbed } from 'discord.js';
import EventEmitter from 'events';

const YOUTUBE_MATCH = /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9-_]{11}/;

export default class YoutubeStreamer extends EventEmitter
{
  static isValid(url)
  {
      return YOUTUBE_MATCH.test(url);
  }

  constructor(adder, url)
  {
      super()
      this.adder = adder;
      this.url = url;
      this.infos = ytdl.getInfo(url)
  }

  get stream()
  {
    this.emit('music')
    return this.infos.then(infos => ytdl.downloadFromInfo(infos, { filter: 'audioonly' }));
  }

  get embed()
  {
    return this.infos.then(({ author, iurlmq, title, short_view_count_text, published, length_seconds }) => {
      const minutes = (length_seconds / 60).toFixed(0);
      const seconds = length_seconds % 60;

      const length =  (minutes > 0 ? `${minutes}min ` : '') + `${seconds}s`;

      return new RichEmbed()
        .setAuthor(author.name, author.avatar, author.channel_url)
        .setImage(iurlmq)
        .setTitle(title)
        .setURL(this.url)
        .setFooter(length + ' - ' + short_view_count_text.replace('views', 'vues'))
        .setTimestamp(new Date(published));
    })
  }

  get title()
  {
      return this.infos.then(({ title }) => title);
  }
}
