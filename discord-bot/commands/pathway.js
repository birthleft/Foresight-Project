const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const Node = require('../models/database/node.js');
const Network = require('../models/database/network.js');
const Pathway = require('../models/database/pathway.js');

const NodeManager = require('../managers/node.js');
const PathwayManager = require('../managers/pathway.js');
const RepositoryManager = require('../managers/repository.js');
const NetworkManager = require('../managers/network.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pathway')
		.setDescription('Handles all Pathway related commands.')
		.addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Creates a Pathway to all the Nodes in a Network.')
                .addStringOption(option =>
                    option
                        .setName('pathway')
                        .setDescription('The Pathway channel name')))
        .addSubcommand(subcommand => 
            subcommand
                .setName('send')
                .setDescription('Sends a Message through the Pathway.')
                .addStringOption(option =>
                    option
                        .setName('message')
                        .setDescription('The Message to be sent'))),
	async execute(interaction) {
        if(interaction.options.getSubcommand() === 'create') {
            // We get the Pathway channel name.
            const channelName = interaction.options.getString('pathway') ?? 'pathway';
            // We ensure that the channel is a Shell of a Node within a Network.
            await RepositoryManager.checkIfChannelIsShellOfProject(interaction.channel.id)
                .then(
                    async (isShellOfProject) => {
                        if (!isShellOfProject) {
                            // If the channel is not a Shell of a Node within a Network, we send a message.
                            await interaction.reply(
                                {
                                    content: `This channel is not the Shell of any existing Node within any existing Network.`,
                                    ephemeral: true
                                }
                            );
                            return;
                        }
                    }
                );
            // We find the project's Network using the Shell.
            await NetworkManager.findNetworkSnowflakeOfShellChannel(interaction.channel.id)
                .then(
                    async (networkSnowflake) => {
                        // We check to see if there a Pathway already in the Guild.
                        await PathwayManager.findPathwayChannelFromGuild(interaction.guild.id)
                            .then(
                                async (pathwayChannel) => {
                                    if (pathwayChannel !== null) {
                                        // If there is a Pathway already in the Guild, we send a message.
                                        await interaction.reply(
                                            {
                                                content: `There is already a Pathway in this Guild.`,
                                                ephemeral: true
                                            }
                                        );
                                        return;
                                    }
                                }
                            );
                            // We find the Category of the Shell.
                            await RepositoryManager.findProjectCategoryOfShellChannel(interaction.channel.id)
                                .then(
                                    async (category) => {
                                        // We create the Pathway channel.
                                        await interaction.guild.channels.create(
                                            {
                                                name: channelName, 
                                                type: ChannelType.GuildText, 
                                                parent: category
                                            }
                                        ).then(
                                            async (pathwayChannel) => {
                                                // We create the Pathway in the database.
                                                await Pathway.class.create(
                                                    {
                                                        guildSnowflake: interaction.guild.id,
                                                        channelSnowflake: pathwayChannel.id,
                                                        networkSnowflake: networkSnowflake
                                                    }
                                                ).then(
                                                    async (pathway) => {
                                                        // We send a message.
                                                        await interaction.reply(
                                                            {
                                                                content: `Pathway for Network ${pathway.networkSnowflake} created successfully.`,
                                                                ephemeral: true
                                                            }
                                                        );
                                                        return;
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                    }
                );
        }
        else if (interaction.option.getSubcommand() === 'send') {
            // We get the Message to be sent.
            const message = interaction.options.getString('message');
            // We check if the channel is a Pathway.
            await PathwayManager.checkIfChannelIsPathway(interaction.channel.id)
                .then(
                    async (isPathway) => {
                        if (!isPathway) {
                            // If the channel is not a Pathway, we send a message.
                            await interaction.reply(
                                {
                                    content: `This channel is not a Pathway.`,
                                    ephemeral: true
                                }
                            );
                            return;
                        }
                    }
                );
            // We find the Network Snowflake of the Pathway.
            await NetworkManager.findNetworkSnowflakeOfPathwayChannel(interaction.channel.id)
                .then(
                    async (networkSnowflake) => {
                        // We create the Message Embed.
                        const messageEmbed = new EmbedBuilder()
                            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL() })
                            .setDescription(message)
                            .setTimestamp()
                            .setFooter({ text: `Sent from ${interaction.guild.name}` });
                        // We get all the Nodes in the Network.
                        await NodeManager.findAllNodesFromNetworkExceptCurrent(interaction.guild.id, networkSnowflake)
                            .then(
                                async (nodes) => {
                                    // For each Node in the Network, we send the Message.
                                    nodes.forEach(
                                        async (node) => {
                                            const pathwayChannel = await PathwayManager.findPathwayChannelFromNodeData(node.guildSnowflake, node.channelSnowflake);
                                            await pathwayChannel.send(
                                                {
                                                    embeds: [messageEmbed]
                                                }
                                            );
                                        }
                                    );
                                    await interaction.reply(
                                        {
                                            content: `Message sent successfully.`,
                                            ephemeral: true
                                        }
                                    );
                                    return;
                                }
                            );
                    }
                );
        }
	},
}