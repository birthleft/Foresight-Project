const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { Snowflake } = require('nodejs-snowflake');

const Node = require('../models/database/node.js');
const Network = require('../models/database/network.js');
const LedgerManager = require('../managers/ledger.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('repository')
        .setDescription('Handles all Repository related commands.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('attach')
                .setDescription('Attaches a new Repository category to the server and a Shell channel for it.')
                .addStringOption(option =>
                    option
                        .setName('repo')
                        .setDescription('The Repository category name')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('shell')
                        .setDescription('The Shell channel name'))
                .addStringOption(option =>
                    option
                        .setName('network')
                        .setDescription('The Snowflake of the Network')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('detach')
                .setDescription('Detaches an existing Python project category from the server.')
                .addChannelOption(option =>
                    option
                        .setName('project')
                        .setDescription('The Python project category name')
                        .setRequired(true))),
	async execute(interaction) {
        if (interaction.options.getSubcommand() === 'attach') {
            const categoryName = interaction.options.getString('repo');
            const channelName = interaction.options.getString('shell') ?? 'shell';
            const networkSnowflake = interaction.options.getString('network') ?? null;
            // We defer the reply to avoid the 3 seconds timeout.
            await interaction.deferReply({
                ephemeral: true
            });
            // We create the Repository's category first.
            await interaction.guild.channels.create(
                {
                    name: categoryName, 
                    type: ChannelType.GuildCategory
                }
            ).then(
                async (category) => {
                    // Then we create the Shell channel.
                    await interaction.guild.channels.create(
                        {
                            name: channelName, 
                            type: ChannelType.GuildText, 
                            parent: category
                        }).then(
                            async (channel) => {
                                if (networkSnowflake !== null) {
                                    // If the user provided a Network Snowflake, we check if it exists.
                                    console.log(networkSnowflake);
                                    await Network.find(networkSnowflake).then(
                                        async (network) => {
                                            if (network !== null) {
                                                // TODO: Find a way to pull the Ledger from the Network.
                                                // If it exists, we attach the server to the list of existing Nodes tied to a Network.
                                                Node.insert(interaction.guild.id, networkSnowflake, channel.id).then(
                                                    async () => {
                                                        const ledgerMessage = await LedgerManager.findLedgerFromNetwork(interaction.guild.id, networkSnowflake);
                                                        if (ledgerMessage !== null) {
                                                            // If the Ledger exists, we update it.
                                                            await LedgerManager.pullLedgerAndUploadItToShellChannel(channel, categoryName, ledgerMessage).then(
                                                                async () => {
                                                                    // We recreate the Repository from the Ledger. 
                                                                    await LedgerManager.recreateRepositoryFromLedger(interaction.guild, interaction.client.user.id, category, ledgerMessage);
                                                                    // We send a message.
                                                                    await interaction.editReply(
                                                                        {
                                                                            content: `Attached the Python project category named \'${categoryName}\' to the server and a Python console channel named \'${channelName}\' based on the existing Network with the Snowflake \'${networkSnowflake}\'. Valid Ledger also found.`,
                                                                            ephemeral: true
                                                                        }
                                                                    );
                                                                    return;
                                                                }
                                                            )
                                                        }
                                                        else {
                                                            // If the Ledger doesn't exist, we create a new one.
                                                            await LedgerManager.createNewLedgerAndUploadItToShellChannel(channel, categoryName);
                                                            // We send a message.
                                                            await interaction.editReply(
                                                                {
                                                                    content: `Attached the Python project category named \'${categoryName}\' to the server and a Python console channel named \'${channelName}\' based on the existing Network with the Snowflake \'${networkSnowflake}\'. Valid Ledger not found. Created a new one.`,
                                                                    ephemeral: true
                                                                }
                                                            );
                                                            return;
                                                        }
                                                    }
                                                )
                                            }
                                            else {
                                                // If it doesn't exist, we return an error.
                                                await interaction.editReply(
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
                                    // If the user didn't provide a Network Snowflake, we create a new Network by generating a Snowflake.
                                    const uidSnowflake = new Snowflake();
                                    const networkId = uidSnowflake.getUniqueID().toString();
                                    // We then create a new Ledger for the Network and upload it to the channel.
                                    await LedgerManager.createNewLedgerAndUploadItToShellChannel(channel, categoryName);
                                    // We then attach the server to the list of existing Nodes tied to a Network.
                                    Network.insert(networkId).then(
                                        async () => {
                                            Node.insert(interaction.guild.id, networkId, channel.id).then(
                                                async () => {
                                                    await interaction.editReply(
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
            await interaction.editReply(
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