const { SlashCommandBuilder, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');

const Workspace = require('../models/database/node.js');
const VersionControl = require('../models/database/versioncontrol.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('script')
        .setDescription('Handles all Python script related commands.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Creates a new Python script file.')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The Python script file name')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Deletes an existing Python script file.')
                .addChannelOption(option =>
                    option.setName('name')
                        .setDescription('The Python script file name')
                        .setRequired(true))),
	async execute(interaction) {
        if (interaction.options.getSubcommand() === 'create') {
            const scriptFileName = interaction.options.getString('name');

            Workspace.class.findOne({ where: { channelSnowflake: interaction.channel.id, guildSnowflake: interaction.guild.id, fileName: "console" } }).then(
                async (consoleEntry) => {
    
                    if(consoleEntry === null) {
                        await interaction.reply(
                            { 
                                content: `You need to call this command inside a Python module's console channel.`, 
                                ephemeral: true 
                            }
                        );
                        return;
                    }
    
                    interaction.guild.channels.fetch(consoleEntry.channelSnowflake).then(
                        async (consoleChannel) => {
                            const everyoneRole = interaction.guild.roles.cache.find(role => role.name === '@everyone');

                            await interaction.guild.channels.create(
                                {
                                    name: scriptFileName, 
                                    type: ChannelType.GuildText,
                                    parent: consoleChannel.parent,
                                    permissionOverwrites: [
                                        {
                                            id: everyoneRole.id,
                                            deny: [PermissionsBitField.Flags.SendMessages],
                                        },
                                    ],
                                }
                            ).then(
                                async (channel) => {

                                    const scriptEmbed = new EmbedBuilder()
                                        .setColor(0x0099FF)
                                        .setTitle('Some title')
                                        .setURL('https://discord.js.org/')
                                        .setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
                                        .setDescription('Some description here')
                                        .setThumbnail('https://i.imgur.com/AfFp7pu.png')
                                        .addFields(
                                            { name: 'Regular field title', value: 'Some value here' },
                                            { name: '\u200B', value: '\u200B' },
                                            { name: 'Inline field title', value: 'Some value here', inline: true },
                                            { name: 'Inline field title', value: 'Some value here', inline: true },
                                        )
                                        .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
                                        .setImage('https://i.imgur.com/AfFp7pu.png')
                                        .setTimestamp()
                                        .setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

                                    await channel.send({ embeds: [scriptEmbed] }).then(
                                        async (message) => {
                                            Workspace.class.create({ channelSnowflake: channel.id, guildSnowflake: interaction.guild.id, categorySnowflake: interaction.channel.parent.id, latestMessageSnowflake: message.id, fileName: `${scriptFileName}.py`}).then(
                                                async () => {
                                                    await channel.threads.create(
                                                        {
                                                            name: "v1.0",
                                                            type: ChannelType.PublicThread,
                                                            reason: 'Initial version',
                                                        }
                                                    ).then(
                                                        async (thread) => {
                                                            await thread.send({ embeds: [scriptEmbed] }).then(
                                                                async (message) => {
                                                                    VersionControl.class.create({ channelSnowflake: channel.id, guildSnowflake: interaction.guild.id, categorySnowflake: interaction.channel.parent.id, threadSnowflake: thread.id }).then(
                                                                        async () => {
                                                                            await interaction.reply(
                                                                                { 
                                                                                    content: `Created an empty Python script named \'${scriptFileName}.py\'.`, 
                                                                                    ephemeral: true 
                                                                                }
                                                                            );
                                                                            return;
                                                                        }
                                                                    )
                                                                }
                                                            );
                                                        }
                                                    )
                                                }
                                            )
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }
        else if (interaction.options.getSubcommand() === 'delete') {
            const scriptChannel = interaction.options.getChannel('name');

            Workspace.class.findOne({ where: { channelSnowflake: interaction.channel.id, guildSnowflake: interaction.guild.id, fileName: "console" } }).then(
                async (consoleEntry) => {
    
                    if(consoleEntry === null) {
                        await interaction.reply(
                            { 
                                content: `You need to call this command inside a Python module's console channel.`, 
                                ephemeral: true 
                            }
                        );
                        return;
                    }
    
                    interaction.guild.channels.delete(scriptChannel.id).then(
                        async () => {
                            Workspace.class.destroy({ where: { channelSnowflake: scriptChannel.id, guildSnowflake: interaction.guild.id } }).then(
                                async () => {
                                    await interaction.reply(
                                        { 
                                            content: `Removed the Python script named \'${scriptChannel.name}.py\'.`,
                                            ephemeral: true 
                                        }
                                    );
                                    return;
                                }
                            )
                        }
                    );
                }
            );
        }
	},
}