// Import Node's native file system module, used to read the commands directory and identify our command files.
const fs = require('node:fs');

// Import Node's native path utility module, helping construct paths to access files and directories.
const path = require('node:path');

// Import the Sequelize module, used to connect to the database.
const sequelize = require('./config/database.js');

// Import all Sequelize models.
const Network = require('./models/database/network.js');
Network.initialize(sequelize);

const Node = require('./models/database/node.js');
Node.initialize(sequelize);

// Import the Colors module, used to color console output.
const Colors = require('colors');

// Syncronize the models.
Network.syncForced();
Node.syncForced();

// Require the necessary DiscordJS classes
const { Collection, Events } = require('discord.js');

// Create a new client instance
const client = require('./config/client.js');

// Authetificate to the database.
sequelize.authenticate().then(() => {
    console.log('[INFO] Connection to the database has been established successfully.');
}).catch((error) => {
    console.error('[ERROR] Unable to connect to the database: ', error);
});

// Initiate DiscordJS's Collection class, used to store and efficiently retrieve commands for execution.
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(Colors.yellow(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`));
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);