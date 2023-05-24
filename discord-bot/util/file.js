const http = require('node:https');
const fs = require('node:fs');

module.exports = {
    remove: (path) => {
        fs.rm(path, { recursive: true, force: true }, async function (error) {
            if (error) {
                console.error('[ERROR] [FILE-UTILS] Unable to delete the Path: ', error);
            }
            else {
                console.log('[INFO] [FILE-UTILS] The Path has been deleted.');
            }
        });
    },
    download: (url, path) => {
        return new Promise((resolve) => {
            http.get(url, (response) => {
                if (response.statusCode !== 200) {
                    console.error('[INFO] [FILE-UTILS] Failed to download file. Server returned ${response.statusCode}');
                    resolve(false);
                    return;
                }
                // Create a write stream to save the file
                const fileStream = fs.createWriteStream(path);
                // Pipe the HTTP response into the file stream
                response.pipe(fileStream);
                // Handle the 'finish' event to know when the download is complete
                fileStream.on('finish', () => {
                    console.log('[INFO] [FILE-UTILS] File downloaded successfully.');
                    resolve(true);
                });
            }).on('error', (err) => {
                console.error('[INFO] [FILE-UTILS] Error while downloading file:', err.message);
                resolve(false);
            });
        });
    },
    read: async (path) => {
        return fs.promises.readFile(path, 'utf8').then(
            (data) => {
                console.log('[INFO] [FILE-UTILS] Successfully read the File.');
                return data;
            }
        ).catch(
            (error) => {
                console.error('[ERROR] [FILE-UTILS] Unable to read the File: ', error);
                return null;
            }
        );
    },
    writeEmpty: async (path) => {
        fs.writeFile(path, "", (error) => {
            if (error) {
                console.error('[ERROR] [FILE-UTILS] Unable to write the File: ', error);
            }
            else {
                console.log('[INFO] [FILE-UTILS] Successfully wrote the File.');
            }
        });
    }
}