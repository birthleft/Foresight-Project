const Node = require('../models/database/node.js');

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