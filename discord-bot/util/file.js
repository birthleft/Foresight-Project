const request = require('node:https');
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
        request .get(url)
                .on('error', console.error)
                .pipe(fs.createWriteStream(path));
    },
}