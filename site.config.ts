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

  /*
   * The theme, declared once so the framework and this app agree.
   *
   * stx injects its own pre-paint guard and, left unconfigured, defaults to
   * `dark` under the storage key `theme`. This site stores the visitor's
   * choice under `of-theme`, so the two disagreed: the guard read a key
   * nobody wrote, fell back to dark, and re-asserted it on every load and
   * every SPA navigation — which is why picking light did not survive a
   * refresh. `auto` follows the operating system until the visitor decides;
   * the colours are the page background in each mode, so the browser chrome
   * matches instead of flashing black or white.
   */
  theme: {
    default: 'auto',
    storageKey: 'of-theme',
    colors: { light: '#f3f5ef', dark: '#0c0f0b' },
  },

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
