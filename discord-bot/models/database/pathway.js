const { DataTypes, Model } = require('sequelize');
const { syncAltered } = require('./network');

class Pathway extends Model {}

module.exports = {
    class: Pathway,
    initialize: (sequelize) => {
        Pathway.init({
            channelSnowflake: {
                type: DataTypes.STRING,
                allowNull: false
            },
            guildSnowflake: {
                type: DataTypes.STRING,
                allowNull: false
            },
            networkSnowflake: {
                type: DataTypes.STRING,
                allowNull: false
            },
        }, {
            sequelize,
            timestamps: false,
            freezeTableName: true,
        });
    },
    insert: async (channelSnowflake, guildSnowflake, networkSnowflake) => {
        Pathway.create(
            {
                channelSnowflake: channelSnowflake,
                guildSnowflake: guildSnowflake,
                networkSnowflake: networkSnowflake,
            }
        ).then(() => {
            console.log('[INFO] [1/4]: Added a new Pathway into the \'Pathway\' table.');
            console.log('[INFO] [2/4]: Channel Snowflake: ', channelSnowflake);
            console.log('[INFO] [3/4]: Guild Snowflake: ', guildSnowflake);
            console.log('[INFO] [3/4]: Network Snowflake: ', networkSnowflake);
        }).catch((error) => {
            console.error('[ERROR] Unable to add a new Pathway into the \'Pathway\' table: ', error);
        });
    },
    remove: async (channelSnowflake) => {
        Pathway.destroy({
            where: {
                channelSnowflake: channelSnowflake
            }
        }).then(() => {
            console.log('[INFO] [1/2]: Removed a Pathway from the \'Pathway\' table.');
            console.log('[INFO] [2/2]: Thread Snowflake: ', channelSnowflake);
        }).catch((error) => {
            console.error('[ERROR] Unable to remove a Pathway from the \'Pathway\' table: ', error);
        });
    },
    sync: () => {
        Pathway.sync().then(() => {
            console.log('[INFO] Syncronized the \'Pathway\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to syncronize the \'Pathway\' table: ', error);
        });
    },
    syncForced: () => {
        Pathway.sync({ force: true }).then(() => {
            console.log('[INFO] Successfully reset the \'Pathway\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to forcefully reset the \'Pathway\' table: ', error);
        });
    },
    syncAltered: () => {
        Pathway.sync({ alter: true }).then(() => {
            console.log('[INFO] Altered the \'Pathway\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to alter the \'Pathway\' table: ', error);
        });
    },
}
