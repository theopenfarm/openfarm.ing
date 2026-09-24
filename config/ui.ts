import type { StxOptions as UiOptions } from '@stacksjs/stx'

/**
 * STX Configuration for Stacks
 * Note: Dashboard mode overrides these settings via serve() options
 */

export default {
  // Where stx keeps everything it generates: the compiled-template cache, the
  // Crosswind CSS cache, client-script bundles, the route manifest and route
  // types. Stacks keeps every runtime-owned directory under storage/ rather
  // than a `.stx` in the project root - see `stxPath()` in @stacksjs/path,
  // which also exports this as STX_DIR for processes that never read a config.
  stateDir: 'storage/framework/stx',

  // Components directory - for user-defined components
  componentsDir: 'resources/components',

  // Expose @stacksjs/components' ui library (<Sidebar>, <Button>, ...)
  // to tag resolution everywhere — the dashboard's macOS-style sidebar
  // resolves through this. See the plugin file for the lookup order.
  plugins: ['./storage/framework/defaults/stx-components-plugin.ts'],

  // Layouts directory - for layout templates
  layoutsDir: 'resources/layouts',

  // Partials directory - for partial templates
  partialsDir: 'resources/partials',

  // bun-plugin-stx 0.2.30x transcodes every raster in public/ to avif and webp
  // at five widths before the production server starts listening. Its cache
  // lives in stateDir, which is inside the release directory, so every deploy
  // starts cold: about two minutes locally and longer on the shared box. That
  // is past the deploy's health gate, so the release never takes over. The
  // views do not use the responsive variants, so turn the warmup off.
  imageWarmup: false,
// `plugins` landed in stx after the pinned @stacksjs/stx types — widen until the dep updates.
// `imageWarmup` is read by bun-plugin-stx's serve() but not declared on StxOptions.
} satisfies UiOptions & { plugins?: string[], imageWarmup?: boolean }
