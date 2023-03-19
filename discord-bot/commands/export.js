const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('export')
		.setDescription('Exports all available Python code in a ZIP format.'),
	async execute(interaction) {
		await interaction.reply(
            {
                content: `This command is not yet implemented.`,
                ephemeral: true
            }
        );
		return;
	},
}