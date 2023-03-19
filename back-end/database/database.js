const Mongo = require("mongodb");
const Colors = require("colors");

const client = new Mongo.MongoClient('mongodb://localhost:27017', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    monitorCommands: true
});

client.on('commandStarted', (event) => console.debug(`[DEBUG] [START] ${Colors.yellow(event)}`));
client.on('commandSucceeded', (event) => console.debug(`[DEBUG] [SUCCEED] ${Colors.green(event)}`));
client.on('commandFailed', (event) => console.debug(`[DEBUG] [FAIL] ${Colors.red(event)}`));

client.connect(error => {
    if (error) {
        console.error(`[ERROR] ${error}`);
        process.exit(-1);
    }
    
    console.log(`[INFO] Successfully connected to the database.`);
})

module.exports = client;