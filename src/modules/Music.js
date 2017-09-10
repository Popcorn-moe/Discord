import ytdl from 'ytdl-core';
import { RichEmbed } from 'discord.js';
import { client } from '../discord';
import { command } from '../decorators';
import { embeds, random } from '../utils';

const greets = [
    './assets/moemoekyun.mp3',
    './assets/niconiconi.mp3',
    './assets/nyanpasu.mp3',
    './assets/tuturu.mp3'
];

export default class Music
{
    constructor()
    {
        this.queue   = new Map();
        this.volumes = new Map();
    }

    @command(/^come$/i)
    come({ member, channel })
    {
        this.queue.set(channel.guild.id, []);
        this.volumes.set(channel.guild.id, 0.10);

        if (!member.voiceChannel)
        {
            channel.send({ embed: embeds.err('Vous n\'êtes pas dans un channel!') })
                .then(msg => embeds.timeDelete(msg));
            return;
        }

        member.voiceChannel.join()
            .then(connection =>
                  {
                      connection.playFile(random(greets), { volume: 0.75 });

                      const embed = new RichEmbed()
                          .setTitle(`Connecté sur ${connection.channel.name}!`)
                          .setColor(0x3df75f); //Todo gif :)
                      channel.send({ embed });
                  })
            .catch(err => console.error(err));

    }


    @command(/^stop$/i)
    stop({ channel })
    {
        if (!channel.guild.voiceConnection)
        {
            channel.send({ embed: embeds.err('Le bot n\'est connecté à aucun channel!') })
                .then(msg => embeds.timeDelete(msg));
            return;
        }

        channel.guild.voiceConnection.disconnect();

        const embed = new RichEmbed()
            .setTitle(`Déconnecté.`)
            .setColor(0xdb1348); //Todo gif :)

        channel.send({ embed });
    }

    @command(/^play (.+)$/i)
    play({ member, channel }, url)
    {
        if (!channel.guild.voiceConnection)
        {
            channel.send({ embed: embeds.err('Le bot n\'est connecté à aucun channel!') })
                .then(msg => embeds.timeDelete(msg));
            return;
        }

        if (!YoutubeStreamer.isYoutube(url))
        {
            channel.send({ embed: embeds.err('Je ne comprends pas cet url') })
                .then(msg => embeds.timeDelete(msg));
            return;
        }

        const streamer = new YoutubeStreamer(member, url);
        streamer.fetchInfo().then(
            () =>
            {
                const queue = this.queue.get(channel.guild.id);
                queue.push(streamer);

                if (queue.length - 1)
                {
                    const embed = streamer.embed
                        .setColor(0x3df75f);
                    channel.send(
                        `🎵  Ajouté à la queue (ajouté par ${streamer.adder.displayName})  🎵`,
                        { embed });
                }
                else
                {
                    this.next({ channel });
                }
            }
        ).catch(err => console.error(err));
    }

    @command(/^next$/i)
    next({ channel }, volume = this.volumes.get(channel.guild.id))
    {
        const queue = this.queue.get(channel.guild.id);

        if (!queue)
        {
            channel.send({ embed: embeds.err('Le bot n\'est connecté à aucun channel!') })
                .then(msg => embeds.timeDelete(msg));
            return;
        }

        const streamer = queue[0];

        if (!streamer)
        {
            this.volumes.set(channel.guild.id, volume);
            client.user.setGame('')
                .catch(err => console.error(err));
            return;
        }

        client.user.setGame('🎵 ' + streamer.title)
            .catch(err => console.error(err));

        const embed = streamer.embed
            .setColor(0x3dd8f7);
        channel.send(
            `🎵  Actuellement joué (ajouté par ${streamer.adder.displayName})  🎵`,
            { embed });

        const handler = channel.guild.voiceConnection.playStream(streamer.stream, { volume });
        handler.once('end', () =>
        {
            queue.shift();
            this.next({ channel }, handler.volume);
        });

        //Event handling
        handler.on('error', err =>
        {
            console.error(err);
            channel.send({ embed: embeds.err(err) })
                .then(msg => embeds.timeDelete(msg));
        });
    }

    @command(/^skip(?: (\d+))?$/i)
    skip({ channel }, num = 1)
    {
        if (!channel.guild.voiceConnection || !channel.guild.voiceConnection.dispatcher)
        {
            channel.send({ embed: embeds.err('Le bot ne joue actuellement pas!') })
                .then(msg => embeds.timeDelete(msg));
            return;
        }
        const queue = this.queue.get(channel.guild.id);

        const embed = new RichEmbed()
            .setTitle(`${queue.length < num ? queue.length : num} musiques passées`)
            .setColor(0xeaf73d); //Todo gif :)
        channel.send({ embed });

        queue.splice(0, num - 1);

        channel.guild.voiceConnection.dispatcher.end();
    }

    @command(/^queue$/i)
    showQueue({ channel })
    {
        const queue = this.queue.get(channel.guild.id);
        if (!queue)
        {
            channel.send({ embed: embeds.err('Le bot ne joue actuellement pas!') })
                .then(msg => embeds.timeDelete(msg));
            return;
        }

        if (!queue.length)
        {
            const embed = new RichEmbed()
                .setTitle(`Il n'y a pas de musique dans la queue.`)
                .setColor(0xeaf73d); //Todo gif :)
            channel.send({ embed });
            return;
        }

        channel.send('🎵  Liste des musiques dans la queue  🎵');

        queue.forEach((streamer, i) => {
            const embed = streamer.embed
                .setColor(0x0ce9f4);
            channel.send(
                i
                    ? `⏩  ${i}. Ajouté par ${streamer.adder.displayName}`
                    : `▶  Actuellement joué (ajouté par ${streamer.adder.displayName})`,
                { embed });
        });
    }

    @command(/^volume(?: (\d+)%?)?$/i)
    volume({ channel }, percent)
    {

        if (!channel.guild.voiceConnection)
        {
            channel.send({ embed: embeds.err('Le bot n\'est connecté à aucun channel!') })
                .then(msg => embeds.timeDelete(msg));
            return;
        }

        if (percent < 0 || percent > 250)
        {
            channel.send({ embed: embeds.err('Impossible de définir le volume dans cet intervale') })
                .then(msg => embeds.timeDelete(msg));
            return;
        }

        const dispatcher = channel.guild.voiceConnection.dispatcher;

        if (percent)
        {
            if (dispatcher)
                dispatcher.setVolume(percent / 100);
            else
                this.volumes.set(channel.guild.id, percent / 100);

            const embed = new RichEmbed()
                .setTitle(`Le volume est maintenant à ${percent}%!`)
                .setColor(0xeaf73d); //Todo gif :)
            channel.send({ embed });

        }
        else
        {

            const volume = dispatcher ? dispatcher.volume : this.volumes.get(channel.guild.id);
            const embed  = new RichEmbed()
                .setTitle(`Le volume est à ${(volume * 100).toFixed(0)}%!`)
                .setColor(0xeaf73d); //Todo gif :)
            channel.send({ embed });
        }
    }

    @command(/^clearQueue$/i)
    clearQueue({ channel })
    {
        this.queue.set(channel.guild.id, []);

        channel.guild.voiceConnection && channel.guild.voiceConnection.dispatcher &&
        channel.guild.voiceConnection.dispatcher.end(); //beautiful

        const embed = new RichEmbed()
            .setTitle(`La queue a été vidée.`)
            .setColor(0xeaf73d); //Todo gif :)
        channel.send({ embed });
    }

    @command(/^pause$/i)
    pause({ channel })
    {
        const dispatcher = channel.guild.voiceConnection && channel.guild.voiceConnection.dispatcher;
        if (!dispatcher)
        {
            channel.send({ embed: embeds.err('Le bot ne joue actuellement pas!') })
                .then(msg => embeds.timeDelete(msg));
            return;
        }

        dispatcher.setPaused(!dispatcher.paused);

        const embed = new RichEmbed()
            .setTitle(dispatcher.paused ? '⏸  Pause' : '▶  Repris')
            .setColor(dispatcher.paused ? 0xeaf73d : 0x3df75f); //Todo gif :)
        channel.send({ embed });
    }

    @command(/^removeQueue(?: (\d+))?$/i)
    removeQueue({ channel }, num)
    {
        const queue = this.queue.get(channel.guild.id);
        if (!queue)
        {
            channel.send({ embed: embeds.err('Le bot ne joue actuellement pas!') })
                .then(msg => embeds.timeDelete(msg));
            return;
        }

        if (!num)
        {
            channel.send({ embed: embeds.err('Veuillez donner un emplacement de musique de la queue.') })
                .then(msg => embeds.timeDelete(msg));
            return;
        }

        const embed = new RichEmbed()
            .setTitle(`Musique supprimée de la queue`)
            .setColor(0xeaf73d); //Todo gif :)
        channel.send({ embed });

        queue.splice(num - 1, num);
    }
}

const YOUTUBE_MATCH = /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9-_]{11}/;

export class YoutubeStreamer
{
    static isYoutube(url)
    {
        return YOUTUBE_MATCH.test(url);
    }

    constructor(adder, url)
    {
        this.adder = adder;
        this.url   = url;
        this.info  = null;
    }

    get stream()
    {
        return ytdl(this.url, { filter: 'audioonly' });
    }

    fetchInfo()
    {
        const self = this;
        return new Promise(
            (resolve, reject) => ytdl.getInfo(this.url).then(
                info =>
                {
                    self.info = info;
                    resolve(self);
                }).catch(err => reject(err))
        );
    }

    get embed()
    {
        return new RichEmbed()
            .setAuthor(this.info.author.name, this.info.author.avatar, this.info.author.channel_url)
            .setImage(this.info.iurlmq)
            .setTitle(this.info.title)
            .setURL(this.url)
            .setFooter(this.length + ' - ' + this.info.short_view_count_text.replace('views', 'vues'))
            .setTimestamp(new Date(this.info.published));
    }

    get length()
    {
        const minutes = (this.info.length_seconds / 60).toFixed(0);
        const seconds = this.info.length_seconds % 60;

        return (minutes > 0 ? `${minutes}min ` : '') + `${seconds}s`;
    }

    get title()
    {
        return this.info.title;
    }
}

