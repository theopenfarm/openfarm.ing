import { defineSiteConfig } from '@stacksjs/stx'

/**
 * stx site configuration.
 *
 * The only thing this file does today is turn on i18n. The framework reads it
 * at boot: the dev server and `buddy serve` both mount the locale routes
 * (`/de/...`, `/nl/...`), the locale switch endpoint, and the translation
 * pass that resolves `{t:key}` tokens in the templates.
 */
export const site = defineSiteConfig({
  name: 'Open Farming',
  url: 'https://openfarm.ing',
  description: 'Autonomous drone scouting for farms. Scan the field, find the problem, treat only the square metres that need it.',
  pagesDir: 'resources/views',

  i18n: {
    // English is the source language: the copy is written in it and the other
    // two are translations of it, not parallel originals.
    //
    // German and Dutch because that is where the customers are. The farms this
    // is built for are in Bavaria, Lower Saxony, Gelderland and Flevoland, and
    // a farmer reading about a fawn search before first cut should not have to
    // do it in a second language.
    locales: ['en', 'de', 'nl'],
    defaultLocale: 'en',
    labels: { en: 'EN', de: 'DE', nl: 'NL' },
    translationsDir: 'resources/translations',
    format: 'json',
  },
})

export default site
