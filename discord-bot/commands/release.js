const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('release')
        .setDescription('Handles all Release related commands.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Creates a new Release.')
                .addStringOption(option => 
                    option
                        .setName('name')
                        .setDescription('The Release name')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Deletes an existing Release.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lists all available Releases.')),
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