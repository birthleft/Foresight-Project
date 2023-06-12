const Node = require('../models/database/node.js');

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