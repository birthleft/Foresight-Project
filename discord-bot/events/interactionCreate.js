const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`[ERROR] No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			console.log(`[INFO] Executing \'\/${interaction.commandName}\', requested by ${interaction.member.displayName} (${interaction.member}).`)
			await command.execute(interaction);
		} catch (error) {
			console.error(`[ERROR] Error executing \'\/${interaction.commandName}\'.`);
			console.error(`[ERROR] ${error}`);
		}
	},
};