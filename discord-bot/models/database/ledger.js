const { DataTypes, Model } = require('sequelize');
const SHA256 = require('crypto-js/sha256');

class Ledger extends Model {}

module.exports = {
    class: Ledger,
    initialize: (sequelize) => {
        Ledger.init({
            index: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            data: {
                type: DataTypes.STRING,
                allowNull: false
            },
            hash: {
                type: DataTypes.STRING,
            },
            previous: {
                type: DataTypes.STRING,
            },
        }, {
            sequelize,
            timestamps: true,
            createdAt: 'timestamp',
            updatedAt: false,
            freezeTableName: true,
        });
    },
    insert: (previousHash, data) => {
        const currentBlock = Ledger.create(
            {
                data: data,
                previous: previousHash,
            }
        ).then(() => {
            Ledger.update(
                {
                    hash: SHA256(currentBlock.index + currentBlock.timestamp + currentBlock.previous + JSON.stringify(currentBlock.data)).toString(),
                },
                {
                    where: {
                        index: currentBlock.index
                    }
                }
            ).then(() => {
                console.log('[INFO] Inserted a new row into the \'Ledger\' table.');
                return currentBlock.hash;
            })
        }).catch((error) => {
            console.error('[ERROR] Unable to insert a new row into the \'Ledger\' table: ', error);
            return null;
        });
    },
    find: (index) => {
        Ledger.findOne({
            where: {
                index: index
            }
        }).then((result) => {
            console.log('[INFO] Found a row in the \'Ledger\' table.');
            return result;
        }).catch((error) => {
            console.error('[ERROR] Unable to find a row in the \'Ledger\' table: ', error);
            return null;
        });
    },
    sync: () => {
        Projects.sync().then(() => {
            console.log('[INFO] Syncronized the \'Projects\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to syncronize the \'Projects\' table: ', error);
        });
    },
    syncForced: () => {
        Projects.sync({ force: true }).then(() => {
            console.log('[INFO] Successfully reset the \'Projects\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to reset the \'Projects\' table: ', error);
        });;
    },
    syncAltered: () => {
        Projects.sync({ alter: true }).then(() => {
            console.log('[INFO] Altered the \'Projects\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to alter the \'Projects\' table: ', error);
        });
    },
}

