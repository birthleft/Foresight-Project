const fs = require('node:fs');
const Sequelize = require('sequelize');
const Colors = require('colors');
const Ledger = require('../models/database/ledger.js');

const FileData = require('../models/local/filedata.js');
const ModificationType = require('../models/local/modificationtype.js');

module.exports = {
    createNewLedger: async (categoryName) => {
        const ledgerSequelize = new Sequelize(categoryName, 'user', 'user', {
            host: 'localhost',
            dialect: 'sqlite',
            logging: (...msg) => console.log(Colors.white(`[LEDGER] ${msg}`)),
            // SQLite only
            storage: './temp/ledger.sqlite',
        });
        
        ledgerSequelize.authenticate().then(() => {
            console.log('[INFO] Connection to the LEDGER Database has been established successfully.');
        }).catch((error) => {
            console.error('[ERROR] Unable to connect to the LEDGER database: ', error);
        });

        await Ledger.initialize(ledgerSequelize).then(
            async () => {
                await Ledger.syncForced().then(
                    async () => {
                        const initialCommit = new FileData(ModificationType.Initialize, null, null);
                        await Ledger.insert(null, initialCommit).then(
                            async () => {
                                console.log('[INFO] Added the initial commit into the \'Ledger\' table.');
                            }
                        )
                    }
                )
            }
        );

        await ledgerSequelize.close().then(
            async () => {
                console.log('[INFO] Connection to the LEDGER Database has been closed successfully.');
            }
        );
    },
}