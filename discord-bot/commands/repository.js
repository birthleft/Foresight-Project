const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { Snowflake } = require('nodejs-snowflake');

const Node = require('../models/database/node.js');
const Network = require('../models/database/network.js');
const LedgerManager = require('../managers/ledger.js');
const NetworkManager = require('../managers/network.js');

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
                .setDescription('Detaches an existing Repository category from the server.')
                .addChannelOption(option =>
                    option
                        .setName('shell')
                        .setDescription('The Repository\'s Shell channel')
                        .setRequired(true))),
	async execute(interaction) {
        // We defer the reply to avoid the 3 seconds timeout.
        await interaction.deferReply({
            ephemeral: true
        });

        if (interaction.options.getSubcommand() === 'attach') {
            const categoryName = interaction.options.getString('repo');
            const channelName = interaction.options.getString('shell') ?? 'shell';
            const networkSnowflake = interaction.options.getString('network') ?? null;
            if (networkSnowflake !== null) {
                // If the user provided a Network Snowflake, we check if it exists.
                const network = await Network.find(networkSnowflake)
                if (network !== null) {
                    // If it exists, we create the Repository's category.
                    const category = await interaction.guild.channels.create(
                        {
                            name: categoryName, 
                            type: ChannelType.GuildCategory
                        }
                    );
                    
                    // Then we create the Shell channel.
                    const channel = await interaction.guild.channels.create(
                        {
                            name: channelName, 
                            type: ChannelType.GuildText, 
                            parent: category
                        }
                    );
                    // We attach the server to the list of existing Nodes tied to a Network.
                    Node.insert(interaction.guild.id, networkSnowflake, channel.id);
                    // We find the Ledger of the Network.
                    const ledgerMessage = await LedgerManager.findLedgerFromNetwork(interaction.guild.id, networkSnowflake);
                    if (ledgerMessage !== null) {
                        // If the Ledger exists, we update it.
                        await LedgerManager.pullLedgerAndUploadItToShellChannel(channel, categoryName, ledgerMessage).then(
                            async () => {
                                // We recreate the Repository from the Ledger. 
                                await LedgerManager.recreateRepositoryFromLedger(interaction.guild, interaction.client.user.id, category, ledgerMessage);
                            });
                        // We send a message.
                        await interaction.editReply(
                            {
                                content: `Attached the Repository category named \'${categoryName}\' to the server and the Shell channel named \'${channelName}\' based on the existing Network with the Snowflake \'${networkSnowflake}\'. \n\nValid Ledger also found.`,
                                ephemeral: true
                            }
                        );
                        return;
                    }
                    else {
                        // If the Ledger doesn't exist, we create a new one.
                        await LedgerManager.createNewLedgerAndUploadItToShellChannel(channel, categoryName);
                        // We send a message.
                        await interaction.editReply(
                            {
                                content: `Attached the Repository category named \'${categoryName}\' to the server and the Shell channel named \'${channelName}\' based on the existing Network with the Snowflake \'${networkSnowflake}\'. \n\nValid Ledger not found. Created a new one.`,
                                ephemeral: true
                            }
                        );
                        return;
                    }
                }
                else {
                    // If it doesn't exist, we return an error.
                    await interaction.editReply(
                        { 
                            content: `The Snowflake you provided does not belong to any existing network.`, 
                            ephemeral: true 
                        }
                    );
                    return;
                }
            }
            else {
                // If the user didn't provide a Network Snowflake, we create a new Network by generating a Snowflake.
                const uidSnowflake = new Snowflake();
                const networkId = uidSnowflake.getUniqueID().toString();
                // We create the Repository's category.
                const category = await interaction.guild.channels.create(
                    {
                        name: categoryName, 
                        type: ChannelType.GuildCategory
                    }
                );
                // Then we create the Shell channel.
                const channel = await interaction.guild.channels.create(
                    {
                        name: channelName, 
                        type: ChannelType.GuildText, 
                        parent: category
                    }
                );
                // We then create a new Ledger for the Network and upload it to the channel.
                await LedgerManager.createNewLedgerAndUploadItToShellChannel(channel, categoryName);
                // We then attach the server to the list of existing Nodes tied to a Network.
                Network.insert(networkId).then(
                    async () => {
                        Node.insert(interaction.guild.id, networkId, channel.id);
                    }
                );
                // We send a message.
                await interaction.editReply(
                    { 
                        content: `Attached the Repository category named \'${categoryName}\' to the server and a Shell channel named \'${channelName}\'.`, 
                        ephemeral: true 
                    }
                );
                return;
            }
        }
        else if (interaction.options.getSubcommand() === 'detach') {
            const shellChannel = interaction.options.getChannel('shell');
            // We get the Network Snowflake of the Shell channel.
            const networkSnowflake = await NetworkManager.findNetworkSnowflakeOfShellChannel(interaction.guild.id, shellChannel.id);
            if (networkSnowflake === null) {
                // If the Shell channel is not tied to a Network, we return an error.
                await interaction.editReply(
                    { 
                        content: `The channel you provided is not a Shell channel tied to any existing network.`, 
                        ephemeral: true 
                    }
                );
                return;
            }
            // We get the category of the Shell channel.
            const category = shellChannel.parent;
            // We delete all the channels in the category.
            await Promise.all(category.children.cache.map(async (channel) => 
                {
                    await channel.delete();
                }
            )).then(
                async () => {
                    // We delete the category.
                    await category.delete();
                });
            // We delete the Node.
            await Node.remove(interaction.guild.id, networkSnowflake, shellChannel.id).then(
                async () => {
                    // We check if the Network is still tied to any other Nodes.
                    const nodes = await Node.findAllByNetworkSnowflake(networkSnowflake);
                    if (nodes.length === 0) {
                        // If it's not, we delete the Network.
                        await Network.remove(networkSnowflake);
                    }
                });

            await interaction.editReply(
                {
                    content: `Detached the Repository category named \'${category.name}\' from the server.`,
                    ephemeral: true
                }
            );
            return;
        }
	},
}