const { DataTypes, Model } = require('sequelize');

class Network extends Model {}

module.exports = {
    class: Network,
    initialize: (sequelize) => {
        Network.init({
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
    insert: async (networkSnowflake) => {
        Network.create(
            {
                networkSnowflake: networkSnowflake,
            }
        ).then(() => {
            console.log('[INFO] [1/2]: Added a new Network into the \'Network\' table.');
            console.log('[INFO] [2/2]: Network Snowflake: ', networkSnowflake);
        }).catch((error) => {
            console.error('[ERROR] Unable to add a new Network into the \'Network\' table: ', error);
        });
    },
    remove: async (networkSnowflake) => {
        Network.destroy({
            where: {
                networkSnowflake: networkSnowflake
            }
        }).then(() => {
            console.log('[INFO] [1/2]: Removed a Network from the \'Network\' table.');
            console.log('[INFO] [2/2]: Network Snowflake: ', networkSnowflake);
        }).catch((error) => {
            console.error('[ERROR] Unable to remove a Network from the \'Network\' table: ', error);
        });
    },
    find: async (networkSnowflake) => {
        Network.findOne({
            where: {
                networkSnowflake: networkSnowflake
            }
        }).then((result) => {
            console.log('[INFO] [1/2]: Found a Network in the \'Network\' table.');
            console.log('[INFO] [2/2]: Network Snowflake: ', networkSnowflake);
            return result;
        }).catch((error) => {
            console.error('[ERROR] Unable to find a Network in the \'Network\' table: ', error);
            return null;
        });
    },
    sync: () => {
        Network.sync().then(() => {
            console.log('[INFO] Syncronized the \'Network\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to syncronize the \'Network\' table: ', error);
        });
    },
    syncForced: () => {
        Network.sync({ force: true }).then(() => {
            console.log('[INFO] Successfully reset the \'Network\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to reset the \'Network\' table: ', error);
        });;
    },
    syncAltered: () => {
        Network.sync({ alter: true }).then(() => {
            console.log('[INFO] Altered the \'Network\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to alter the \'Network\' table: ', error);
        });
    },
}

