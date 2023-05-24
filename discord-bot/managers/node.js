const Sequelize = require('sequelize');
const Colors = require('colors');
const Ledger = require('../models/database/ledger.js');
const Node = require('../models/database/node.js');
const FileUtil = require('../util/file.js');

const FileData = require('../models/local/filedata.js');
const ModificationType = require('../models/local/modificationtype.js');

const client = require('../config/client.js');

module.exports = {
    findNodeDataFromShellChannel: async (guildSnowflake, channelSnowflake) => {
        const node = await Node.class.findOne({
            where: {
                guildSnowflake: guildSnowflake,
                channelSnowflake: channelSnowflake
            }
        });
        return node;
    },
    findAllNodesFromNetworkExceptCurrent: async (guildSnowflake, networkSnowflake) => {
        const nodes = await Node.class.findAll({
            where: {
                networkSnowflake: networkSnowflake
            }
        });
        return nodes.filter((node) => {
            return node.guildSnowflake !== guildSnowflake;
        });
    },
}