module.exports = class FileData {
    constructor(modificationType, fileName, fileContent) {
        this.modificationType = modificationType;
        this.fileName = fileName;
        this.fileContent = fileContent;
    }
}