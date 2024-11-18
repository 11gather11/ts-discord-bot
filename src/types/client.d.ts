import type {
	AutocompleteInteraction,
	ButtonInteraction,
	CacheType,
	ChatInputCommandInteraction,
	Collection,
	ModalSubmitInteraction,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js'

export interface Command {
	command: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder
	execute: (interaction: ChatInputCommandInteraction) => void
	autocomplete?: (interaction: AutocompleteInteraction) => void
	modal?: (interaction: ModalSubmitInteraction<CacheType>) => void
	button?: (interaction: ButtonInteraction) => void
	cooldown?: number
}

export interface BotEvent {
	name: string
	once?: boolean | false
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	execute: (...args: any) => void | Promise<void>
}

declare module 'discord.js' {
	interface Client {
		commands: Collection<string, Command>
		cooldowns: Collection<string, number>
	}
}
