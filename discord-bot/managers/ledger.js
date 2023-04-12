const Sequelize = require('sequelize');
const Colors = require('colors');
const Ledger = require('../models/database/ledger.js');
const Node = require('../models/database/node.js');
const FileUtil = require('../util/file.js');

const FileData = require('../models/local/filedata.js');
const ModificationType = require('../models/local/modificationtype.js');

const client = require('../config/client.js');

module.exports = {
    createNewLedgerAndUploadItToChannel: async (channel) => {
        const ledgerSequelize = new Sequelize('ledger', 'user', 'user', {
            host: 'localhost',
            dialect: 'sqlite',
            logging: (...msg) => console.log(Colors.white(`[LEDGER] ${msg}`)),
            // SQLite only
            storage: './temp/ledger.sqlite',
        });

        Ledger.initialize(ledgerSequelize);

        Ledger.syncForced();
        
        await ledgerSequelize.authenticate().then(() => {
            console.log('[INFO] [LEDGER-MANAGER] Connection to the Ledger Database has been established successfully.');
        }).catch((error) => {
            console.error('[ERROR] [LEDGER-MANAGER] Unable to connect to the Ledger database: ', error);
        });

        const initialCommit = new FileData(ModificationType.Initialize, '', '');
        Ledger.insert('', initialCommit);

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
            //content: '',
        }).then(async (message) => {
            await message.pin();
            console.log('[INFO] [LEDGER-MANAGER] The Ledger has been uploaded to the channel.');
            ledgerSequelize.close().then(() => {
                console.log('[INFO] [LEDGER-MANAGER] The connection to the Ledger database has been closed.');
                FileUtil.remove('./temp/ledger.sqlite');
            });
        });
    },
    getLedgerMessageFromNode: async (guildSnowflake, networkSnowflake) => {
        Node.class.findOne({
            where: {
                guildSnowflake: guildSnowflake,
                networkSnowflake: networkSnowflake
            }
        }).then((result) => {
            client.channels.fetch(result.channelSnowflake).then((channel) => {
                channel.messages.fetchPinned().then((messages) => {
                    messages.forEach(message => {
                        if (message.author.id === client.user.id && message.embeds[0].title === 'Ledger' && message.files[0].name === 'ledger.sqlite')
                            console.log('[INFO] [LEDGER-MANAGER] [1/3] The Ledger has been found from Node.');
                            console.log('[INFO] [LEDGER-MANAGER] [2/3] Guild SnowFlake: ', guildSnowflake);
                            console.log('[INFO] [LEDGER-MANAGER] [3/3] Network SnowFlake: ', networkSnowflake);
                            return message;
                    });
                    console.log('[ERROR] [LEDGER-MANAGER] The Ledger has not been found from Node.');
                });
            });
        });
    },
    mapCommitsFromNodeLedgerByTimestamp: async () => {
        const message = await this.getLedgerMessageFromNode(guildSnowflake, networkSnowflake);
        if (message) {
            FileUtil.download(message.files[0].url, './temp/ledger.sqlite');

            const ledgerSequelize = new Sequelize('ledger', 'user', 'user', {
                host: 'localhost',
                dialect: 'sqlite',
                logging: (...msg) => console.log(Colors.white(`[LEDGER] ${msg}`)),
                // SQLite only
                storage: './temp/ledger.sqlite',
            });

            Ledger.initialize(ledgerSequelize);

            Ledger.syncForced();

            await ledgerSequelize.authenticate().then(() => {
                console.log('[INFO] [LEDGER-MANAGER] Connection to the Ledger Database has been established successfully.');
            }).catch((error) => {
                console.error('[ERROR] [LEDGER-MANAGER] Unable to connect to the Ledger database: ', error);
            });

            const map = new Map();

            Ledger.findAll().then((result) => {
                result.forEach((commit) => {
                    map.set(commit.timestamp, commit);
                });
            });

            ledgerSequelize.close().then(() => {
                console.log('[INFO] [LEDGER-MANAGER] The connection to the Ledger database has been closed.');
                FileUtil.remove('./temp/ledger.sqlite');
            });

            return map;
        }
    },
}