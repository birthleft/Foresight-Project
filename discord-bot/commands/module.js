const { SlashCommandBuilder, ChannelType } = require('discord.js');

const Workspace = require('../models/workplace.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('module')
        .setDescription('Handles all Python module related commands.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('attach')
                .setDescription('Attaches a new Python module category to the server and a Python console channel for it.')
                .addStringOption(option =>
                    option.setName('module')
                        .setDescription('The Python module category name')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('console')
                        .setDescription('The Python console channel name')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('detach')
                .setDescription('Detaches an existing Python module category from the server.')
                .addChannelOption(option =>
                    option.setName('module')
                        .setDescription('The Python module category name')
                        .setRequired(true))),
	async execute(interaction) {
        if (interaction.options.getSubcommand() === 'attach') {
            const categoryName = interaction.options.getString('module');
            const channelName = interaction.options.getString('console') ?? 'console';
    
            interaction.guild.channels.create(
                {
                    name: categoryName, 
                    type: ChannelType.GuildCategory
                }
            ).then(
                async (category) => {
                    interaction.guild.channels.create(
                        {
                            name: channelName, 
                            type: ChannelType.GuildText, 
                            parent: category
                        }).then(
                            async (channel) => {
                                Workspace.class.create({ channelSnowflake: channel.id, guildSnowflake: interaction.guild.id, categorySnowflake: category.id, fileName: `console`}).then(
                                    async () => {
                                        await interaction.reply(
                                            { 
                                                content: `Attached the Python module category named \'${categoryName}\' to the server and a Python console channel named \'${channelName}\'.`, 
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
        else if (interaction.options.getSubcommand() === 'detach') {
            const moduleCategory = interaction.options.getChannel('module');

            if(moduleCategory.type !== ChannelType.GuildCategory) {
                await interaction.reply(
                    { 
                        content: `You must reference a server's Category.`, 
                        ephemeral: true 
                    }
                );
                return;
            }
    
            Workspace.class.findOne({ where: { categorySnowflake: moduleCategory.id, guildSnowflake: interaction.guild.id, fileName: "console" } }).then(
                async (consoleEntry) => {
                    if (consoleEntry === null) {
                        await interaction.reply(
                            {
                                content: `You need to call this command inside a Python module's console channel.`,
                                ephemeral: true
                            }
                        );
                        return;
                    }
    
                    Workspace.class.findAll({ where: { categorySnowflake: moduleCategory.id, guildSnowflake: interaction.guild.id } }).then(
                        async (entries) => {
                            entries.forEach(
                                async (entry) => {
                                    await interaction.guild.channels.delete(entry.channelSnowflake).then(
                                        async () => {
                                            Workspace.class.destroy({ where: { channelSnowflake: entry.channelSnowflake, guildSnowflake: interaction.guild.id } }).then(
                                                async () => {
                                                    console.log(`[INFO] [DETACH] Removed the Python script named \'${entry.fileName}\'.`);
                                                }
                                            );
                                        }
                                    );
                                }
                            );

                            await interaction.guild.channels.delete(moduleCategory.id).then(
                                async () => {
                                    await interaction.reply(
                                        {
                                            content: `Removed the Python module named \'${moduleCategory.name}\'.`,
                                            ephemeral: true
                                        }
                                    );
                                    return;
                                }
                            );
                        }
                    );
                }
            )
        }
	},
}