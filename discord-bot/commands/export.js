const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('export')
		.setDescription('Handles all export related commands.')
		.addSubcommand(subcommand =>
            subcommand
                .setName('all')
                .setDescription('Exports all of the currently available Python modules.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('module')
                .setDescription('Exports a specific Python module.')
                .addChannelOption(option =>
                    option.setName('name')
                        .setDescription('The Python module category name')
                        .setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('script')
				.setDescription('Exports a specific Python script.')
				.addChannelOption(option =>
					option.setName('name')
						.setDescription('The Python script channel name')
						.setRequired(true))),
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