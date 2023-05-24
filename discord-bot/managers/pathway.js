const Sequelize = require('sequelize');
const Colors = require('colors');
const Ledger = require('../models/database/ledger.js');
const Node = require('../models/database/node.js');
const Pathway = require('../models/database/pathway.js')
const FileUtil = require('../util/file.js');

const FileData = require('../models/local/filedata.js');
const ModificationType = require('../models/local/modificationtype.js');

const client = require('../config/client.js');

module.exports = {
    checkIfChannelIsPathway: async (channelSnowflake) => {
        const pathway = await Pathway.class.findOne({
            where: {
                channelSnowflake: channelSnowflake
            }
        });
        return pathway !== null;
    },
    findPathwayChannelFromNodeData: async (guildSnowflake, networkSnowflake) => {
        const pathway = await Pathway.class.findOne({
            where: {
                guildSnowflake: guildSnowflake,
                networkSnowflake: networkSnowflake
            }
        });
        return pathway ? await client.channels.fetch(pathway.channelSnowflake) : null;
    },
}