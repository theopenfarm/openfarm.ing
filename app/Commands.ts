export interface CommandConfig {
  /** The command file name (without .ts extension) */
  file: string
  /** Whether the command is enabled */
  enabled?: boolean
  /** Command aliases */
  aliases?: string[]
}

export type CommandRegistry = Record<string, string | CommandConfig>

/**
 * The application's command registry.
 *
 * Commands listed here will be auto-loaded by the CLI.
 * You can use a simple string (file name) or a config object for more control.
 *
 * @example
 * // Simple registration
 * 'inspire': 'Inspire',
 *
 * // With config
 * 'send-emails': {
 *   file: 'SendEmails',
 *   enabled: true,
 *   aliases: ['emails', 'mail'],
 * },
 */
export default {
  // Publishes the capability catalog and the demonstration field. Runs on
  // every deploy (config/cloud.ts preStart), so a content edit ships with it.
  'catalog:sync': 'CatalogSync',
  // Builds the social share cards from the site's photography.
  'og:generate': 'OgImages',
  // Hands the seeded holdings to the demo login, by name rather than by
  // whichever account the seeder happened to pick.
  'demo:account': 'DemoAccount',
  // Attaches a flight's stitched orthomosaic, which is what lets the field
  // map show the ground rather than a plan of it.
  'imagery:attach': 'FieldImagery',
  'inspire': 'Inspire',
} satisfies CommandRegistry
