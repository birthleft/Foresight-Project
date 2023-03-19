const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('execute')
		.setDescription('Executes a Python module.'),
	async execute(interaction) {
		await interaction.reply(
            {
                content: `This command is not yet implemented.`,
                ephemeral: true
            }
        );
	},
}