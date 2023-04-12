const { SlashCommandBuilder, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('script')
        .setDescription('Handles all Python script related commands.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Creates a new Python script file.')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The Python script file name')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Deletes an existing Python script file.')
                .addChannelOption(option =>
                    option.setName('name')
                        .setDescription('The Python script file name')
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