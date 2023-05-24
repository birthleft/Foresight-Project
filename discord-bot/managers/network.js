const Sequelize = require('sequelize');
const Colors = require('colors');
const Ledger = require('../models/database/ledger.js');
const Node = require('../models/database/node.js');
const FileUtil = require('../util/file.js');

const FileData = require('../models/local/filedata.js');
const ModificationType = require('../models/local/modificationtype.js');

const client = require('../config/client.js');

module.exports = {
    findNetworkSnowflakeOfShellChannel: async (guildSnowflake, channelSnowflake) => {
        const node = await Node.class.findOne({
            where: {
                guildSnowflake: guildSnowflake,
                channelSnowflake: channelSnowflake
            }
        });
        return node ? node.networkSnowflake : null;
    },
    findNetworkSnowflakeOfPathwayChannel: async (guildSnowflake, channelSnowflake) => {
        const pathway = await Pathway.class.findOne({
            where: {
                guildSnowflake: guildSnowflake,
                channelSnowflake: channelSnowflake
            }
        });
        return pathway ? pathway.networkSnowflake : null;
    },
}