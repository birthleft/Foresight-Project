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
    insert: async (previousHash, data) => {
        const currentBlock = Ledger.build(
            {
                data: JSON.stringify(data),
                previous: previousHash,
            }
        );

        currentBlock.hash = SHA256(currentBlock.index + currentBlock.timestamp + currentBlock.previous + JSON.stringify(currentBlock.data)).toString();
        
        return currentBlock.save().then(() => {
            console.log('[INFO] [1/5] Added a new Entry into the \'Ledger\' table.');
            console.log('[INFO] [2/5] Data: ', data);
            console.log('[INFO] [3/5] Previous Hash: ', previousHash);
            console.log('[INFO] [4/5] Current Hash: ', currentBlock.hash);
            console.log('[INFO] [5/5] Current Index: ', currentBlock.index);
            return currentBlock;
        }).catch((error) => {
            console.error('[ERROR] Unable to add a new Entry into the \'Ledger\' table: ', error);
            return null;
        });
    },
    find: (index) => {
        return Ledger.findOne({
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
    findLatest: () => {
        return Ledger.findOne({
            order: [
                ['timestamp', 'DESC']
            ]
        }).then((result) => {
            console.log('[INFO] Found the latest row in the \'Ledger\' table.');
            return result;
        }).catch((error) => {
            console.error('[ERROR] Unable to find the latest row in the \'Ledger\' table: ', error);
            return null;
        });
    },
    sync: () => {
        Ledger.sync().then(() => {
            console.log('[INFO] Syncronized the \'Ledger\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to syncronize the \'Ledger\' table: ', error);
        });
    },
    syncForced: () => {
        Ledger.sync({ force: true }).then(() => {
            console.log('[INFO] Successfully reset the \'Ledger\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to reset the \'Ledger\' table: ', error);
        });;
    },
    syncAltered: () => {
        Ledger.sync({ alter: true }).then(() => {
            console.log('[INFO] Altered the \'Ledger\' table.');
        }).catch((error) => {
            console.error('[ERROR] Unable to alter the \'Ledger\' table: ', error);
        });
    },
}

