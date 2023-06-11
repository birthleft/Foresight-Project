const { SlashCommandBuilder, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');

const Sequelize = require('sequelize');
const Colors = require('colors');
const Ledger = require('../models/database/ledger.js');
const Node = require('../models/database/node.js');
const Pathway = require('../models/database/pathway.js')
const FileUtil = require('../util/file.js');

const NodeManager = require('../managers/node.js');
const FileManager = require('../managers/file.js');

const FileData = require('../models/local/filedata.js');
const ModificationType = require('../models/local/modificationtype.js');

const client = require('../config/client.js');

module.exports = {
    findShellChannelFromNodeData: async (guildSnowflake, networkSnowflake) => {
        const node = await Node.class.findOne({
            where: {
                guildSnowflake: guildSnowflake,
                networkSnowflake: networkSnowflake
            }
        });
        return node ? client.channels.fetch(node.channelSnowflake) : null;
    },
    findProjectCategoryOfShellChannel: async (channelSnowflake) => {
        const channel = await client.channels.fetch(channelSnowflake);
        return channel ? channel.parent : null;
    },
    checkIfChannelIsShellOfProject: async (channelSnowflake) => {
        const node = await Node.class.findOne({
            where: {
                channelSnowflake: channelSnowflake
            }
        });
        return node !== null;
    },
    broadcastCreateFileToNetwork: async (guildSnowflake, networkSnowflake, channelName) => {
        // We get all the nodes from the network.
        const nodes = await NodeManager.findAllNodesFromNetworkExceptCurrent(guildSnowflake, networkSnowflake);
        return Promise.all(nodes.map(async (node) => {
            // We get the Shell channel of the Node.
            const shellChannel = await client.channels.fetch(node.channelSnowflake);
            if (!shellChannel) {
                console.error('[ERROR] [REPOSITORY-MANAGER] Unable to fetch the Shell channel of the Guild: ' + node.guildSnowflake + '.');
                return;
            }
            // We get the Project category of the Shell channel.
            const projectCategory = shellChannel.parent;
            // We get the Guild of the Node.
            const guild = await client.guilds.fetch(node.guildSnowflake);
            if (!guild) {
                console.error('[ERROR] [REPOSITORY-MANAGER] Unable to fetch the Guild: ' + node.guildSnowflake + '.');
                return;
            }
            // We create the new channel.
            await guild.channels.create(
                {
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: projectCategory,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: client.user.id,
                            allow: [PermissionsBitField.Flags.SendMessages],
                        },
                    ],
                }
            ).then(async (channel) => {
                // We create the local version of the Version Controlled file and upload it.
                FileManager.writeNewFileAndUploadItToChannel(channel);
            });
        }));
    },
    broadcastModifyFileToNetwork: async (guildSnowflake, networkSnowflake, channelName, file) => {
        // We get all the nodes from the network.
        const nodes = await NodeManager.findAllNodesFromNetworkExceptCurrent(guildSnowflake, networkSnowflake);
        return Promise.all(nodes.map(async (node) => {
            // We get the Shell channel of the Node.
            const shellChannel = await client.channels.fetch(node.channelSnowflake);
            if (!shellChannel) {
                console.error('[ERROR] [REPOSITORY-MANAGER] Unable to fetch the Shell channel of the Guild: ' + node.guildSnowflake + '.');
                return;
            }
            // We get the Project category of the Shell channel.
            const projectCategory = shellChannel.parent;
            // We get the File's channel.
            const fileChannel = await FileManager.getFileChannelFromCategory(channelName, projectCategory);
            if (!fileChannel) {
                console.error('[ERROR] [REPOSITORY-MANAGER] Unable to fetch the File channel: ' + channelName + '.');
                return;
            }
            const initMessage = await FileManager.findInitFileWithinChannel(fileChannel);
            if (!initMessage) {
                console.error('[ERROR] [REPOSITORY-MANAGER] Unable to fetch the init message of the File channel: ' + channelName + '.');
                return;
            }
            // We build the new embed.
            const newEmbed = EmbedBuilder.from(initMessage.embeds[0])
                .setDescription('The file has been updated.');
            // We send the new embed with the modified file.
            await fileChannel.send({ embeds: [newEmbed], files: [file] }).then(
                async (message) => {
                    await message.pin();
                }
            )
        }));
    },
    broadcastDeleteFileToNetwork: async (guildSnowflake, networkSnowflake, channelName) => {
        // We get all the nodes from the network.
        const nodes = await NodeManager.findAllNodesFromNetworkExceptCurrent(guildSnowflake, networkSnowflake);
        return Promise.all(nodes.map(async (node) => {
            // We get the Shell channel of the Node.
            const shellChannel = await client.channels.fetch(node.channelSnowflake);
            if (!shellChannel) {
                console.error('[ERROR] [REPOSITORY-MANAGER] Unable to fetch the Shell channel of the Guild: ' + node.guildSnowflake + '.');
                return;
            }
            // We get the Project category of the Shell channel.
            const projectCategory = shellChannel.parent;
            // We get the File's channel.
            const fileChannel = await FileManager.getFileChannelFromCategory(channelName, projectCategory);
            if (!fileChannel) {
                console.error('[ERROR] [REPOSITORY-MANAGER] Unable to fetch the File channel: ' + channelName + '.');
                return;
            }
            // We delete the File's channel.
            await fileChannel.delete();
        }));
    }
}