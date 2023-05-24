const Sequelize = require('sequelize');
const Colors = require('colors');
const Ledger = require('../models/database/ledger.js');
const Node = require('../models/database/node.js');

const FileManager = require('../managers/file.js');
const NodeManager = require('../managers/node.js');
const RepositoryManager = require('../managers/repository.js');

const client = require('../config/client.js');

const FileUtil = require('../util/file.js');

async function __getLedgerMessageFromNodeData(guildSnowflake, networkSnowflake) {
    const channel = await RepositoryManager.findShellChannelFromNodeData(guildSnowflake, networkSnowflake);
    const messages = await channel.messages.fetchPinned();
    for (const [_, message] of messages) {
        if (message.author.id === client.user.id && message.embeds[0].title === 'Ledger' && message.attachments.first().name === 'ledger.sqlite')
            return message;
    }
    return null;
};

module.exports = {
    createNewLedgerAndUploadItToShellChannel: async (channel, categoryName) => {
        // We create a new Sequelize instance for the ledger.
        const ledgerSequelize = new Sequelize('ledger', 'user', 'user', {
            host: 'localhost',
            dialect: 'sqlite',
            logging: (...msg) => console.log(Colors.white(`[LEDGER] ${msg}`)),
            // SQLite only
            storage: './temp/ledger.sqlite',
        });
        // We create a new Ledger model for the ledger.
        Ledger.initialize(ledgerSequelize);
        // We forcefully syncronize the Ledger model.
        Ledger.syncForced();
        // We authetificate to the Ledger database.
        await ledgerSequelize.authenticate().then(() => {
            console.log('[INFO] [LEDGER-MANAGER] Connection to the Ledger Database has been established successfully.');
        }).catch((error) => {
            console.error('[ERROR] [LEDGER-MANAGER] Unable to connect to the Ledger database: ', error);
        });
        // We create a new FileData object, known as the initial commit.
        const initialCommit = FileManager.createInitialCommit();
        // We insert the initial commit into the Ledger.
        await Ledger.insert('', initialCommit);
        // We save the Ledger.
        await channel.send({
            embeds: 
            [
                {
                    title: 'Ledger',
                    description: 'The ledger for the category ' + categoryName + ' has been created.',
                    color: 0x00ff00
                }
            ], 
            files: 
            [
                {
                    attachment: './temp/ledger.sqlite',
                    name: 'ledger.sqlite'
                }
            ],
        }).then(async (message) => {
            await message.pin();
            console.log('[INFO] [LEDGER-MANAGER] The Ledger has been uploaded to the channel.');
            await ledgerSequelize.close().then(() => {
                console.log('[INFO] [LEDGER-MANAGER] The connection to the Ledger database has been closed.');
                FileUtil.remove('./temp/ledger.sqlite');
            });
        });
    },
    findLatestVersionOfLedgerFromNetwork: async (guildSnowflake, networkSnowflake) => {
        // TODO: Implement this.
    },
    getLedgerMessageFromNodeData: async (guildSnowflake, networkSnowflake) => {
        return __getLedgerMessageFromNodeData(guildSnowflake, networkSnowflake);
    },
    addFileDataToLedger: async (fileData, guildSnowflake, networkSnowflake) => {
        // We get the Shell channel from the Node Data.
        const channel = await RepositoryManager.findShellChannelFromNodeData(guildSnowflake, networkSnowflake);
        // We get the Ledger message from the Node Data.
        const ledgerMessage = await __getLedgerMessageFromNodeData(guildSnowflake, networkSnowflake);
        if (channel && ledgerMessage) {
            // We download the ledger.sqlite file.
            FileUtil.download(ledgerMessage.attachments.first().url, './temp/ledger.sqlite').then(
                async (isDownloaded) => {
                    if (isDownloaded) {
                        // We create a new Sequelize instance for the ledger.
                        const ledgerSequelize = new Sequelize('ledger', 'user', 'user', {
                            host: 'localhost',
                            dialect: 'sqlite',
                            logging: (...msg) => console.log(Colors.white(`[LEDGER] ${msg}`)),
                            // SQLite only
                            storage: './temp/ledger.sqlite',
                        });
                        // We create a new Ledger model for the ledger.
                        Ledger.initialize(ledgerSequelize);
                        // We syncronize the Ledger model.
                        Ledger.sync();
                        // We authentificate to the Ledger database.
                        await ledgerSequelize.authenticate().then(() => {
                            console.log('[INFO] [LEDGER-MANAGER] Connection to the Ledger Database has been established successfully.');
                        }).catch((error) => {
                            console.error('[ERROR] [LEDGER-MANAGER] Unable to connect to the Ledger database: ', error);
                        });
                        // We extract the latest block from the Ledger.
                        const latestBlock = await Ledger.findLatest(); 
                        // We insert the fileData into the Ledger.
                        await Ledger.insert(latestBlock.hash, fileData);
                        // We delete the old Ledger message.
                        await ledgerMessage.delete();
                        // We save the Ledger.
                        await channel.send({
                            embeds:
                            [
                                {
                                    title: 'Ledger',
                                    description: 'The ledger for the category ' + channel.parent.name + ' has been updated.',
                                    color: 0x00ff00
                                }
                            ],
                            files:
                            [
                                {
                                    attachment: './temp/ledger.sqlite',
                                    name: 'ledger.sqlite'
                                }
                            ],
                        }).then(async (message) => {
                            // We pin the new ledger message.
                            await message.pin();
                            console.log('[INFO] [LEDGER-MANAGER] The Ledger has been uploaded to the channel.');
                            await ledgerSequelize.close().then(() => {
                                console.log('[INFO] [LEDGER-MANAGER] The connection to the Ledger database has been closed.');
                                FileUtil.remove('./temp/ledger.sqlite');
                            });
                        });
                    }
                    else {
                        console.error('[ERROR] [LEDGER-MANAGER] Unable to download the Ledger file.');
                    }
                });
        }
    }
}