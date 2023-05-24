const { SlashCommandBuilder, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');

const Node = require('../models/database/node.js');
const Network = require('../models/database/network.js');
const Pathway = require('../models/database/pathway.js');

const NodeManager = require('../managers/node.js');
const PathwayManager = require('../managers/pathway.js');
const RepositoryManager = require('../managers/repository.js');
const NetworkManager = require('../managers/network.js');
const FileManager = require('../managers/file.js');
const LedgerManager = require('../managers/ledger.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('file')
        .setDescription('Handles all Version Controled File related commands.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Creates a new Version Controlled file.')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The Version Controlled file name')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Deletes an existing Version Controlled file.')
                .addChannelOption(option =>
                    option.setName('name')
                        .setDescription('The Version Controlled file name')
                        .setRequired(true))),
	async execute(interaction) {
        // We check if the Channel is a Shell channel.
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
        // We find the project's Network using the Shell channel.
        const networkSnowflake = await NetworkManager.findNetworkSnowflakeOfShellChannel(interaction.guild.id, interaction.channel.id);
        // We get the Ledger message.
        const ledgerMessage = await LedgerManager.getLedgerMessageFromNodeData(interaction.guild.id, networkSnowflake);

        if(interaction.options.getSubcommand() === 'create') {
            const channelName = interaction.options.getString('name');
            // We check if the Version Controlled file already exists.
            await FileManager.checkIfFileExists(channelName, ledgerMessage)
                .then(
                    async (fileExists) => {
                        if (fileExists) {
                            // If the Version Controlled file already exists, we send a message.
                            await interaction.reply(
                                {
                                    content: `A Version Controlled file with the name \`${channelName}\` already exists.`,
                                    ephemeral: true
                                }
                            );
                            return;
                        }
                    }
                );
            // We find the project's Category using the Shell channel.
            const projectCategory = await RepositoryManager.findProjectCategoryOfShellChannel(interaction.channel.id);
            // We create a new channel for the Version Controlled file.
            await interaction.guild.channels.create(
                {
                    name: channelName, 
                    type: ChannelType.GuildText, 
                    parent: projectCategory
                }).then(
                    async (channel) => {
                        // // We set the channel's permissions.
                        // await channel.permissionOverwrites.create(
                        //     interaction.guild.roles.everyone, 
                        //     {
                        //         VIEW_CHANNEL: false
                        //     }
                        // );
                        // await channel.permissionOverwrites.create(
                        //     interaction.guild.me, 
                        //     {
                        //         VIEW_CHANNEL: true
                        //     }
                        // );
                        // await channel.permissionOverwrites.create(
                        //     interaction.member, 
                        //     {
                        //         VIEW_CHANNEL: true
                        //     }
                        // );

                        // We create the local version of the Version Controlled file and upload it.
                        FileManager.writeNewFileAndUploadItToChannel(channel);
                        // We create the Version Controlled file.
                        const fileData = FileManager.createNewFile(channelName);
                        // We add the Version Controlled file to the Ledger message.
                        LedgerManager.addFileDataToLedger(fileData, interaction.guild.id, networkSnowflake);

                        console.log(`[INFO] [1/3] The Version Controlled file \`${channelName}\` has been created.`);
                        console.log(`[INFO] [2/3] Network Snowflake: ${networkSnowflake}`);
                        console.log(`[INFO] [3/3] Guild Snowflake: ${interaction.guild.id}`);

                        // We send a message.
                        await interaction.reply(
                            {
                                content: `The Version Controlled file \`${channelName}\` has been created.`,
                                ephemeral: true
                            }
                        );
                        return;
                    });
        }
        else if(interaction.options.getSubcommand() === 'delete') {
            const channelName = interaction.options.getString('name');
            // We check if the Version Controlled file already exists.
            await FileManager.checkIfFileExists(channelName, ledgerMessage)
                .then(
                    async (fileExists) => {
                        if (!fileExists) {
                            // If the Version Controlled file already exists, we send a message.
                            await interaction.reply(
                                {
                                    content: `A Version Controlled file with the name \`${channelName}\` does not exist.`,
                                    ephemeral: true
                                }
                            );
                            return;
                        }
                    }
                );
            // TODO: Finish this.
        }
	},
}