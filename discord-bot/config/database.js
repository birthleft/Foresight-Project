// Import Sequelize, a Node.js module for working with SQL databases.
const Sequelize = require('sequelize');

// Import Colors, a Node.js module for coloring console output.
const Colors = require('colors');

// Create a new Sequelize instance using the SQLite dialect and export it for rest of the files.
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
	host: process.env.DB_HOST,
	dialect: 'sqlite',
	logging: (...msg) => console.log(Colors.white(`[DATABASE] ${msg}`)),
	// SQLite only
	storage: './db.sqlite',
});

module.exports = sequelize;