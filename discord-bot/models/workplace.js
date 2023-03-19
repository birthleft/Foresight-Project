const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Workplace extends Model {}

Workplace.init({
    channelSnowflake: {
        type: DataTypes.STRING,
        allowNull: false
    },
    guildSnowflake: {
        type: DataTypes.STRING,
        allowNull: false
    },
    categorySnowflake: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isReserved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
}, {
    sequelize, // We need to pass the connection instance
    freezeTableName: true,
});

module.exports = {
    class: Workplace,
    sync: () => {
        Workplace.sync().then(() => {
            console.log('[INFO] Syncronized the \'Workplace\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to syncronize the \'Workplace\' table: ', error);
        });
    },
    syncForced: () => {
        Workplace.sync({ force: true }).then(() => {
            console.log('[INFO] Succesfully reset the \'Workplace\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to reset the \'Workplace\' table: ', error);
        });;
    },
    syncAltered: () => {
        Workplace.sync({ alter: true }).then(() => {
            console.log('[INFO] Altered the \'Workplace\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to alter the \'Workplace\' table: ', error);
        });
    },
}

