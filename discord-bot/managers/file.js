const { ChannelType, EmbedBuilder } = require('discord.js');

const Sequelize = require('sequelize');
const Colors = require('colors');

const client = require('../config/client.js');

const Ledger = require('../models/database/ledger.js');

const FileData = require('../models/local/filedata.js');
const ModificationType = require('../models/local/modificationtype.js');

const FileUtil = require('../util/file.js');



async function mapFileChangesFromLedgerMessage(message) {
    const map = new Map();

    if (message) {
        return FileUtil.download(message.attachments.first().url, './temp/mapped/ledger' + '_' + message.id + '.sqlite').then(
            async (isDownloaded) => {
                if (isDownloaded) {
                    const ledgerSequelize = new Sequelize('ledger', 'user', 'user', {
                        host: 'localhost',
                        dialect: 'sqlite',
                        logging: (...msg) => console.log(Colors.white(`[LEDGER] ${msg}`)),
                        // SQLite only
                        storage: './temp/mapped/ledger' + '_' + message.id + '.sqlite',
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
                        FileUtil.remove('./temp/mapped/ledger' + '_' + message.id + '.sqlite');
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
        var createdFlag = false;
        var deletedFlag = false;
        commitMap.forEach((commit) => {
            const commitData = JSON.parse(commit.data);
            if (commitData.fileName === fileName) {
                if (commitData.modificationType === ModificationType.Create) {
                    createdFlag = true;
                    deletedFlag = false;
                } else if (commitData.modificationType === ModificationType.Delete) {
                    createdFlag = false;
                    deletedFlag = true;
                }
            }
        });
        return createdFlag && !deletedFlag;
    },
    writeNewFileAndUploadItToChannel: async (channel) => {
        // We create a new empty temporary file.
        await FileUtil.writeEmpty('./temp/init' + '_' + channel.id);
        const messageEmbed = new EmbedBuilder()
            .setTitle('File')
            .setDescription('The file has been created.')
            .setColor('#00FF00');
        // We send the message to the channel.
        await channel.send({ 
                embeds: [messageEmbed],
                files: [
                    {
                        attachment: './temp/init' + '_' + channel.id,
                        name: 'init'
                    }
                ]
            }).then(async (message) => {
                await message.pin();
                // We delete the temporary file.
                FileUtil.remove('./temp/init' + '_' + channel.id);
            });
    },
    getFileNamesFromFileChanges: async (ledgerMessage) => {
        const commitMap = await mapFileChangesFromLedgerMessage(ledgerMessage);
        const files = new Set();
        if (commitMap) {
            commitMap.forEach((commit) => {
                const commitData = JSON.parse(commit.data);
                if (commitData.modificationType === ModificationType.Create) {
                    files.add(commitData.fileName);
                } else if (commitData.modificationType === ModificationType.Modify) {
                    files.add(commitData.fileName);
                } else if (commitData.modificationType === ModificationType.Delete) {
                    files.delete(commitData.fileName);
                }
            });
        }
        return files;
    },
    getFileContentHistoryFromFileChanges: async (fileName, ledgerMessage) => {
        const commitMap = await mapFileChangesFromLedgerMessage(ledgerMessage);
        const fileHistory = [];
        if (commitMap) {
            commitMap.forEach((commit) => {
                const commitData = JSON.parse(commit.data);
                if (commitData.fileName === fileName) {
                    fileHistory.push(commitData.fileContent);
                }
            });
        }
        return fileHistory;
    },
    getFileChannelFromCategory: async (fileName, category) => {
        const channels = await category.children.cache;
        for (const [_, channel] of channels) {
            if (channel.type === ChannelType.GuildText && channel.name === fileName) {
                return channel;
            }
        }
        return null;
    },
    findInitFileWithinChannel: async (channel) => {
        const messages = await channel.messages.fetchPinned();
        for (const [_, message] of messages) {
            if (message.author.id === client.user.id && message.embeds[0].title === 'File' && message.attachments.first().name === 'init')
                return message;
        }
        return null;
    }
};