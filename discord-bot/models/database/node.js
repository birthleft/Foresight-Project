const { DataTypes, Model } = require('sequelize');
const Network = require('./network');

class Node extends Model {}

module.exports = {
    class: Node,
    initialize: (sequelize) => {
        Node.init({
            guildSnowflake: {
                type: DataTypes.STRING,
                allowNull: false
            },
            networkSnowflake: {
                type: DataTypes.STRING,
                allowNull: false
            },
            channelSnowflake: {
                type: DataTypes.STRING,
                allowNull: false
            },
        }, {
            sequelize,
            timestamps: false,
            freezeTableName: true,
        });
    },
    insert: (guildSnowflake, networkSnowflake, channelSnowflake) => {
        Node.create(
            {
                guildSnowflake: guildSnowflake,
                networkSnowflake: networkSnowflake,
                channelSnowflake: channelSnowflake,
            }
        ).then(() => {
            console.log('[INFO] [1/4]: Added a new Node into the \'Node\' table.');
            console.log('[INFO] [2/4]: Guild Snowflake: ', guildSnowflake);
            console.log('[INFO] [3/4]: Network Snowflake: ', networkSnowflake);
            console.log('[INFO] [4/4]: Channel Snowflake: ', channelSnowflake);
        }).catch((error) => {
            console.error('[ERROR] Unable to insert a new Node into the \'Node\' table: ', error);
        });
    },
    sync: () => {
        Node.sync().then(() => {
            console.log('[INFO] Syncronized the \'Node\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to syncronize the \'Node\' table: ', error);
        });
    },
    syncForced: () => {
        Node.sync({ force: true }).then(() => {
            console.log('[INFO] Successfully reset the \'Node\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to reset the \'Node\' table: ', error);
        });;
    },
    syncAltered: () => {
        Node.sync({ alter: true }).then(() => {
            console.log('[INFO] Altered the \'Node\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to alter the \'Node\' table: ', error);
        });
    },
}

