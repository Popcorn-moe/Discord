import { RichEmbed } from 'discord.js';
import { command } from '../decorators';
import { commands } from '../decorators/command';
import settings from '../../settings.json';

export default class Help
{
    @command(/^help$/)
    help(message)
    {
        const sGuild      = settings.guilds.find(({ id }) => message.guild.id == id);
        const botsChannel = message.guild.channels.find(({ id }) => sGuild.channel.bots == id);

        message.delete();

        botsChannel.send(`<@${message.author.id}>`, { embed: wholeHelp() });

    }
}

const wholeHelp = (() =>
{
    const embed = new RichEmbed()
        .setTitle(`**__Commandes:__**`)
        .addField(`❓ **\\${settings.prefix}help [commande]** [*alias: aide, aled*]`, // ❓ is an emoji
                  `╰> *Afficher une page d'aide à propos d'une commande*`); //Hardcode help 'cause why shouldn't I ?

    const categories = allCategories(commands);

    categories.forEach(
        category => // For all categories
        {
            let field = '';

            const cmds = commands.values().filter(({ category: c }) => category === c);

            cmds.forEach((cmds, i) => { // For all all command in category

                let { name, usage, aliases = [], desc } = cmds.options;

                field += '┃\n';

                const last = i === cmds.length - 1; // Handle last command differently

                let prefix1 = last ? '┗►' : '┣►';
                let prefix2 = last ? '   ' : '┃ ';

                field += prefix1 + ` **\\${settings.prefix}${name} ${usage}**`
                         + (aliases.length > 0 ? ' [*alias: ' + aliases.join(', ') + '*]\n' : '\n')
                         + prefix2 + `     ╰> *${desc}*\n`;
            });

            embed.addField(`▶ **${category.name}** - ${category.desc}`, // ▶ is an emoji
                           field);
        }
    );

    return embed.setImage(settings.images.help)
        .setThumbnail(settings.images.iconAnimated)
        .setColor(0x8ed16c)
        .setTimestamp()
        .setFooter('www.popcorn.moe', settings.images.siteIcon);
})();

function allCategories(commands)
{
    let set = new Set(); // No duplicate

    commands.values().forEach(({ options: { category } }) => set.add(category));

    return set;
}