const { SlashCommandBuilder, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');

const Sequelize = require('sequelize');
const Colors = require('colors');
const Ledger = require('../models/database/ledger.js');
const Node = require('../models/database/node.js');
const Pathway = require('../models/database/pathway.js')
const FileUtil = require('../util/file.js');

const NodeManager = require('../managers/node.js');

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
}