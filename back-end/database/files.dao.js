const files = require('./database').db('foresight').collection('files');

const getAll = async () => {
    const cursor = await books.find();
    return cursor.toArray();
}

const get = async (uid) => {
    return await books.findOne({_id: uid});
}

const insert = async ({uid, title, author, rating, description}) => {
    return await books.insertOne({_id: uid, title, author, rating, description});
}

const update = async (uid, {title, author, rating, description}) => {
    return await books.replaceOne({_id: uid}, {title, author, rating, description})
}

const remove = async (uid) => {
    return await books.deleteOne({_id: uid});
}

module.exports = {getAll, get, insert, update, remove};