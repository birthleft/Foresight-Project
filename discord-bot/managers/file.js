const { SlashCommandBuilder, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');

const Sequelize = require('sequelize');
const Colors = require('colors');

const client = require('../config/client.js');

const Ledger = require('../models/database/ledger.js');
const Node = require('../models/database/node.js');

const FileData = require('../models/local/filedata.js');
const ModificationType = require('../models/local/modificationtype.js');

const FileUtil = require('../util/file.js');



async function mapFileChangesFromLedgerMessage(message) {
    const map = new Map();

    if (message) {
        return FileUtil.download(message.attachments.first().url, './temp/ledger.sqlite').then(
            async (isDownloaded) => {
                if (isDownloaded) {
                    const ledgerSequelize = new Sequelize('ledger', 'user', 'user', {
                        host: 'localhost',
                        dialect: 'sqlite',
                        logging: (...msg) => console.log(Colors.white(`[LEDGER] ${msg}`)),
                        // SQLite only
                        storage: './temp/ledger.sqlite',
                    });
            
                    Ledger.initialize(ledgerSequelize);
            
                    Ledger.sync();
            
                    await ledgerSequelize.authenticate().then(() => {
                        console.log('[INFO] [FILE-MANAGER] Connection to the Ledger Database has been established successfully.');
                    }).catch((error) => {
                        console.error('[ERROR] [FILE-MANAGER] Unable to connect to the Ledger database: ', error);
                    });
            
                    await Ledger.class.findAll().then((result) => {
                        result.forEach((commit) => {
                            map.set(commit.timestamp, commit);
                        });
                    });
            
                    await ledgerSequelize.close().then(() => {
                        console.log('[INFO] [FILE-MANAGER] The connection to the Ledger database has been closed.');
                        FileUtil.remove('./temp/ledger.sqlite');
                    });

                    return map;
                }
                else {
                    console.error('[ERROR] [FILE-MANAGER] Unable to download the Ledger file.');
                    return null;
                }
                
            }
        );
    }
};



module.exports = {
    createInitialCommit: () => {
        return new FileData(ModificationType.Initialize, '', '');
    },
    createNewFile: (fileName) => {
        return new FileData(ModificationType.Create, fileName, '');
    },
    modifyExistingFile: (fileName, fileContent) => {
        return new FileData(ModificationType.Modify, fileName, fileContent);
    },
    deleteExistingFile: (fileName) => {
        return new FileData(ModificationType.Delete, fileName, '');
    },
    checkIfFileExists: async (fileName, ledgerMessage) => {
        const commitMap = await mapFileChangesFromLedgerMessage(ledgerMessage);
        const createdFlag = false;
        const deletedFlag = false;
        commitMap.forEach((commit) => {
            if (commit.fileName === fileName) {
                if (commit.modificationType === ModificationType.Create) {
                    createdFlag = true;
                    deletedFlag = false;
                } else if (commit.modificationType === ModificationType.Delete) {
                    createdFlag = false;
                    deletedFlag = true;
                }
            }
        });
        return createdFlag && !deletedFlag;
    },
    writeNewFileAndUploadItToChannel: async (channel) => {
        // We create a new empty temporary file.
        await FileUtil.writeEmpty('./temp/init');
        const messageEmbed = new EmbedBuilder()
            .setTitle('File Update')
            .setDescription('A new file has been created.')
            .setColor('#00FF00')
            .setTimestamp();
        // We send the message to the channel.
        await channel.send({ 
                embeds: [messageEmbed],
                files: [
                    {
                        attachment: './temp/init',
                        name: 'init'
                    }
                ]
            }).then(() => {
                // We delete the temporary file.
                FileUtil.remove('./temp/init');
            });
    },
};