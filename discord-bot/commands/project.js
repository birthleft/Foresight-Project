const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { Snowflake } = require('nodejs-snowflake');

const Node = require('../models/database/node.js');
const Network = require('../models/database/network.js');
const LedgerManager = require('../managers/ledger.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('project')
        .setDescription('Handles all Python project related commands.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('attach')
                .setDescription('Attaches a new Python project category to the server and a Python console channel for it.')
                .addStringOption(option =>
                    option.setName('project')
                        .setDescription('The Python project category name')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('console')
                        .setDescription('The Python console channel name'))
                .addStringOption(option =>
                    option.setName('snowflake')
                        .setDescription('The Snowflake of the Python project network')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('detach')
                .setDescription('Detaches an existing Python project category from the server.')
                .addChannelOption(option =>
                    option.setName('project')
                        .setDescription('The Python project category name')
                        .setRequired(true))),
	async execute(interaction) {
        if (interaction.options.getSubcommand() === 'attach') {
            const categoryName = interaction.options.getString('project');
            const channelName = interaction.options.getString('console') ?? 'console';
            const networkSnowflake = interaction.options.getString('snowflake') ?? null;

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
                                if (networkSnowflake !== null) {
                                    await Network.find(networkSnowflake).then(
                                        async (network) => {
                                            if (network !== null) {
                                                await Node.insert({ guildSnowflake: interaction.guild.id, networkSnowflake: networkSnowflake, channelSnowflake: channel.id })
                                            }
                                            else {
                                                await interaction.reply(
                                                    { 
                                                        content: `The Snowflake you provided does not belong to any existing Python project network.`, 
                                                        ephemeral: true 
                                                    }
                                                );
                                                return;
                                            }
                                        }
                                    )
                                }
                                else {
                                    const uidSnowflake = new Snowflake();
                                    const networkId = uidSnowflake.getUniqueID().toString();

                                    await LedgerManager.createNewLedgerAndUploadItToChannel(channel);

                                    Network.insert(networkId).then(
                                        async () => {
                                            Node.insert(interaction.guild.id, networkId, channel.id).then(
                                                async () => {
                                                    await interaction.reply(
                                                        { 
                                                            content: `Attached the Python project category named \'${categoryName}\' to the server and a Python console channel named \'${channelName}\'.`, 
                                                            ephemeral: true 
                                                        }
                                                    );
                                                    return;
                                                }
                                            );
                                        }
                                    );
                                }
                            }
                        );
                }
            );
        }
        else if (interaction.options.getSubcommand() === 'detach') {
            await interaction.reply(
                {
                    content: `This command is not yet implemented.`,
                    ephemeral: true
                }
            );
            return;
        /*
            const projectCategory = interaction.options.getChannel('project');

            if(projectCategory.type !== ChannelType.GuildCategory) {
                await interaction.reply(
                    { 
                        content: `You must reference a server's Category.`, 
                        ephemeral: true 
                    }
                );
                return;
            }
    
            Workspace.class.findOne({ where: { categorySnowflake: projectCategory.id, guildSnowflake: interaction.guild.id, fileName: "console" } }).then(
                async (consoleEntry) => {
                    if (consoleEntry === null) {
                        await interaction.reply(
                            {
                                content: `You need to call this command inside a Python project's console channel.`,
                                ephemeral: true
                            }
                        );
                        return;
                    }
    
                    Workspace.class.findAll({ where: { categorySnowflake: projectCategory.id, guildSnowflake: interaction.guild.id } }).then(
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

                            await interaction.guild.channels.delete(projectCategory.id).then(
                                async () => {
                                    await interaction.reply(
                                        {
                                            content: `Removed the Python project named \'${projectCategory.name}\'.`,
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
        */
        }
	},
}