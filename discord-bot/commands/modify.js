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

const FileUtil = require('../util/file.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('modify')
        .setDescription('Modify a file.')
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('The modified file.')
                .setRequired(true)),
	async execute(interaction) {
        // We find the project's Network using the Shell channel.
        const networkSnowflake = await NetworkManager.findNetworkSnowflakeOfShellChannel(interaction.channel.id);
        // We get the Ledger message.
        const ledgerMessage = await LedgerManager.getLedgerMessageFromNodeData(interaction.guild.id, networkSnowflake);

        // We get the modified file.
        const file = interaction.options.getAttachment('file');
        // We check to see if the message is a reply to a message.
        if (interaction.message.reference === null) {
            await interaction.reply(
                {
                    content: `This command must be used as a reply to a message.`,
                    ephemeral: true
                }
            );
            return;
        }
        // We check to see if the message is a reply to a message sent by the bot.
        if (interaction.message.reference.messageID !== interaction.client.user.id) {
            await interaction.reply(
                {
                    content: `This command must be used as a reply to a message sent by the bot.`,
                    ephemeral: true
                }
            );
            return;
        }
        // We check to see if the message is a reply to a message containing a single embed.
        if (interaction.message.reference.embeds.length !== 1) {
            await interaction.reply(
                {
                    content: `This command must be used as a reply to a message containing a single embed.`,
                    ephemeral: true
                }
            );
            return;
        }
        // We build the new embed.
        const newEmbed = EmbedBuilder.from(interaction.message.reference.embeds[0])
                        .setDescription('The file has been updated.')
                        .setTimestamp();
        // We send the new embed with the modified file.
        await interaction.channel.send({ embeds: [newEmbed], files: [file] });
        // We update the new Version Controlled file.
        const fileData = await FileManager.modifyExistingFile(interaction.channel.name, file);
        // We add the new Version Controlled file to the Ledger.
        await LedgerManager.addFileDataToLedger(fileData, ledgerMessage);

        console.log(`[INFO] [1/3] The Version Controlled file \`${interaction.channel.name}\` has been modified.`);
        console.log(`[INFO] [2/3] Network Snowflake: ${networkSnowflake}`);
        console.log(`[INFO] [3/3] Guild Snowflake: ${interaction.guild.id}`);
        // We send a message.
        await interaction.reply(
            {
                content: `The Version Controlled file \`${name}\` has been created.`,
                ephemeral: true
            }
        );
        return;
    },
}