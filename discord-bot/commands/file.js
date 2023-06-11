const { SlashCommandBuilder, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');

const Node = require('../models/database/node.js');
const Network = require('../models/database/network.js');
const Pathway = require('../models/database/pathway.js');

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
                .setName('modify')
                .setDescription('Modifies an existing Version Controlled file.')
                .addChannelOption(option =>
                    option.setName('name')
                        .setDescription('The Version Controlled file name')
                        .setRequired(true))
                .addAttachmentOption(option =>
                    option.setName('file')
                        .setDescription('The modified file')
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
        // We defer the reply to avoid the 3 seconds timeout.
        await interaction.deferReply({
            ephemeral: true
        });
        // We check if the Channel is a Shell channel.
        const isShellOfProject = await RepositoryManager.checkIfChannelIsShellOfProject(interaction.channel.id)
        if (!isShellOfProject) {
            // If the channel is not a Shell of a Node within a Network, we send a message.
            await interaction.editReply(
                {
                    content: `This channel is not the Shell of any existing Node within any existing Network.`,
                    ephemeral: true
                }
            );
            return;
        }
        // We find the project's Network using the Shell channel.
        const networkSnowflake = await NetworkManager.findNetworkSnowflakeOfShellChannel(interaction.guild.id, interaction.channel.id);
        // We get the Ledger message.
        const ledgerMessage = await LedgerManager.getLedgerMessageFromNodeData(interaction.guild.id, networkSnowflake);

        if(interaction.options.getSubcommand() === 'create') {
            const channelName = interaction.options.getString('name').toLowerCase();
            // We check if the Version Controlled file already exists.
            const fileExists = await FileManager.checkIfFileExists(channelName, ledgerMessage)
            if (fileExists) {
                // If the Version Controlled file already exists, we send a message.
                await interaction.editReply(
                    {
                        content: `A Version Controlled file with the name \`${channelName}\` already exists.`,
                        ephemeral: true
                    }
                );
                return;
            }
            // We find the project's Category using the Shell channel.
            const projectCategory = await RepositoryManager.findProjectCategoryOfShellChannel(interaction.channel.id);
            // We create a new channel for the Version Controlled file.
            await interaction.guild.channels.create(
                {
                    name: channelName, 
                    type: ChannelType.GuildText, 
                    parent: projectCategory,
                    permissionOverwrites: 
                    [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: interaction.client.user.id,
                            allow: [PermissionsBitField.Flags.SendMessages],
                        },
                    ],
                }).then(
                    async (channel) => {
                        // We create the local version of the Version Controlled file and upload it.
                        FileManager.writeNewFileAndUploadItToChannel(channel);
                        // We broadcast the creation of the Version Controlled file to the Network.
                        RepositoryManager.broadcastCreateFileToNetwork(interaction.guild.id, networkSnowflake, channelName);
                    });
            // We create the Version Controlled file.
            const fileData = FileManager.createNewFile(channelName);
            // We add the Version Controlled file to the Ledger message.
            await LedgerManager.addFileDataToLedger(fileData, interaction.guild.id, networkSnowflake).then(
                async () => {
                    // We broadcast the Ledger to the Network.
                    await LedgerManager.broadcastLedgerToNetwork(interaction.guild.id, networkSnowflake);
                }
            );

            console.log(`[INFO] [1/3] The Version Controlled file \`${channelName}\` has been created.`);
            console.log(`[INFO] [2/3] Network Snowflake: ${networkSnowflake}`);
            console.log(`[INFO] [3/3] Guild Snowflake: ${interaction.guild.id}`);

            // We send a message.
            await interaction.editReply(
                {
                    content: `The Version Controlled file \`${channelName}\` has been created.`,
                    ephemeral: true
                }
            );
            return;
        }
        else if(interaction.options.getSubcommand() === 'modify') {
            // We get the channel that's going to be modified.
            const channel = interaction.options.getChannel('name');
            // We get the file.
            const file = interaction.options.getAttachment('file');
            // We check if the Version Controlled file already exists.
            const fileExists = await FileManager.checkIfFileExists(channel.name, ledgerMessage)
            if (!fileExists) {
                // If the Version Controlled file doesn't exist, we send a message.
                await interaction.editReply(
                    {
                        content: `A Version Controlled file with the name \`${channel.name}\` does not exist.`,
                        ephemeral: true
                    }
                );
                return;
            }
            // We check to see if the channel from which the command was sent is a repository file with an init file.
            const initMessage = await FileManager.findInitFileWithinChannel(channel);
            // If the channel is not a repository file with an init file, we send a message.
            if (initMessage === null) {
                await interaction.editReply(
                    {
                        content: `This command must be used within a repository file with an init file.`,
                        ephemeral: true
                    }
                );
                return;
            }
            // We build the new embed.
            const newEmbed = EmbedBuilder.from(initMessage.embeds[0])
                .setDescription('The file has been updated.');
            // We send the new embed with the modified file.
            await channel.send({ embeds: [newEmbed], files: [file] }).then(
                async (message) => {
                    await message.pin();
                    // We broadcast the modification of the Version Controlled file to the Network.
                    RepositoryManager.broadcastModifyFileToNetwork(interaction.guild.id, networkSnowflake, channel.name, file);
                }
            )

            // We update the new Version Controlled file.
            const fileData = await FileManager.modifyExistingFile(channel.name, file);
            // We add the new Version Controlled file to the Ledger.
            await LedgerManager.addFileDataToLedger(fileData, interaction.guild.id, networkSnowflake).then(
                async () => {
                    // We broadcast the Ledger to the Network.
                    await LedgerManager.broadcastLedgerToNetwork(interaction.guild.id, networkSnowflake);
                }
            );

            console.log(`[INFO] [1/3] The Version Controlled file \`${channel.name}\` has been modified.`);
            console.log(`[INFO] [2/3] Network Snowflake: ${networkSnowflake}`);
            console.log(`[INFO] [3/3] Guild Snowflake: ${interaction.guild.id}`);
            // We send a message.
            await interaction.editReply(
                {
                    content: `The Version Controlled file \`${channel.name}\` has been updated.`,
                    ephemeral: true
                }
            );
            return;
        }
        else if(interaction.options.getSubcommand() === 'delete') {
            const channel = interaction.options.getChannel('name');
            // We check if the Version Controlled file already exists.
            const fileExists = await FileManager.checkIfFileExists(channel.name, ledgerMessage)
            if (!fileExists) {
                // If the Version Controlled file doesn't exist, we send a message.
                await interaction.editReply(
                    {
                        content: `A Version Controlled file with the name \`${channel.name}\` does not exist.`,
                        ephemeral: true
                    }
                );
                return;
            }
            // We check to see if the channel from which the command was sent is a repository file with an init file.
            const initMessage = await FileManager.findInitFileWithinChannel(channel);
            // If the channel is not a repository file with an init file, we send a message.
            if (initMessage === null) {
                await interaction.editReply(
                    {
                        content: `This command must be used within a repository file with an init file.`,
                        ephemeral: true
                    }
                );
                return;
            }
            // We delete the channel.
            await channel.delete().then(
                async () => {
                    // We broadcast the deletion of the Version Controlled file to the Network.
                    RepositoryManager.broadcastDeleteFileToNetwork(interaction.guild.id, networkSnowflake, channel.name);
                });
            // We delete the Version Controlled file.
            const fileData = await FileManager.deleteExistingFile(channel.name);
            // We also add the deletion of the Version Controlled file to the Ledger.
            await LedgerManager.addFileDataToLedger(fileData, interaction.guild.id, networkSnowflake).then(
                async () => {
                    // We broadcast the Ledger to the Network.
                    await LedgerManager.broadcastLedgerToNetwork(interaction.guild.id, networkSnowflake)
                }
            );

            console.log(`[INFO] [1/3] The Version Controlled file \`${channel.name}\` has been deleted.`);
            console.log(`[INFO] [2/3] Network Snowflake: ${networkSnowflake}`);
            console.log(`[INFO] [3/3] Guild Snowflake: ${interaction.guild.id}`);
            // We send a message.
            await interaction.editReply(
                {
                    content: `The Version Controlled file \`${channel.name}\` has been deleted.`,
                    ephemeral: true
                }
            );
            return;
        }
	},
}