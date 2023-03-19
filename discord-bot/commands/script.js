const { SlashCommandBuilder, ChannelType } = require('discord.js');

const Workspace = require('../models/workplace.js');

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
                            await interaction.guild.channels.create(
                                {
                                    name: scriptFileName, 
                                    type: ChannelType.GuildText,
                                    parent: consoleChannel.parent
                                }
                            ).then(
                                async (channel) => {
                                    Workspace.class.create({ channelSnowflake: channel.id, guildSnowflake: interaction.guild.id, categorySnowflake: interaction.channel.parent.id, fileName: `${scriptFileName}.py`}).then(
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