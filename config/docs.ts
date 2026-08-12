import type { BunPressOptions } from '@stacksjs/bunpress'

/**
 * Open Farming's palette, over the theme's.
 *
 * The theme is a VitePress port and ships indigo, which sat badly beside a
 * page of screenshots of an orange product. Every value below is a token from
 * `public/site.css`, so the documentation and the thing it documents are the
 * same colour.
 *
 * It goes through `markdown.css` rather than `themeConfig.colors`. The theme
 * config's `colors`, `fonts`, `cssVars` and `css` keys are typed and
 * documented, and bunpress's dev server does honour them, but the code path
 * that renders the STATIC build does not - so setting them themes the site you
 * develop and not the one you ship. `markdown.css` reaches both. See the
 * upstream note in `docs/guide/deployment.md`.
 *
 * The theme keys off `--bp-*` variables and scopes dark mode to a `.dark`
 * class, so both blocks are written out here in full.
 */
const theme = `
:root {
  --bp-c-brand-1: #c7511b;
  --bp-c-brand-2: #a8420f;
  --bp-c-brand-3: #a8420f;
  --bp-c-brand-soft: rgb(199 81 27 / 0.09);
  --bp-c-brand: #c7511b;

  --bp-c-bg: #f3f5ef;
  --bp-c-bg-alt: #e8ede0;
  --bp-c-bg-soft: #e8ede0;
  --bp-c-bg-elv: #ffffff;

  --bp-c-border: #d5ddc9;
  --bp-c-divider: #e4e9db;
  --bp-c-gutter: #e4e9db;

  --bp-c-text-1: #10160d;
  --bp-c-text-2: #4c5745;
  --bp-c-text-3: #77836d;

  --bp-c-tip-1: var(--bp-c-brand-1);
  --bp-c-tip-2: var(--bp-c-brand-2);
  --bp-c-tip-3: var(--bp-c-brand-3);
  --bp-c-tip-soft: var(--bp-c-brand-soft);
  --bp-c-note-1: var(--bp-c-brand-1);
  --bp-c-note-2: var(--bp-c-brand-2);
  --bp-c-note-3: var(--bp-c-brand-3);
  --bp-c-note-soft: var(--bp-c-brand-soft);

  --bp-font-family-base: 'Satoshi', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --bp-font-family-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
}

.dark {
  --bp-c-brand-1: #f0762f;
  --bp-c-brand-2: #ff8b48;
  --bp-c-brand-3: #ff8b48;
  --bp-c-brand-soft: rgb(240 118 47 / 0.14);
  --bp-c-brand: #f0762f;

  --bp-c-bg: #0c0f0b;
  --bp-c-bg-alt: #11150f;
  --bp-c-bg-soft: #11150f;
  --bp-c-bg-elv: #151a13;

  --bp-c-border: #29321f;
  --bp-c-divider: #1f2619;
  --bp-c-gutter: #1f2619;

  --bp-c-text-1: #e9eee4;
  --bp-c-text-2: #a3b09a;
  --bp-c-text-3: #76826d;
}

/*
 * Satoshi is the site's typeface, served from this project's own public/fonts.
 * The documentation build does not copy that directory, but the docs are on
 * the same origin as the site, so an absolute path reaches it.
 */
@font-face {
  font-family: 'Satoshi';
  src: url('/fonts/satoshi/Satoshi-Variable.woff2') format('woff2-variations');
  font-weight: 300 900;
  font-style: normal;
  font-display: swap;
}

body,
.bp-doc {
  font-family: var(--bp-font-family-base);
}

/*
 * The screenshots are of a light interface on a light page. A border and a
 * radius stop them dissolving into it, and matter more in dark mode, where an
 * unbounded white rectangle is a flashbang.
 */
.bp-doc img {
  border: 1px solid var(--bp-c-divider);
  border-radius: 10px;
}
`

/**
 * Documentation, served at openfarm.ing/docs.
 *
 * bunpress renders `docsDir` into `<outDir>/.bunpress` and prefixes every
 * internal link and asset with the deploy path, so the pages are written for
 * `/docs` rather than for the site root. `config/cloud.ts` ships that rendered
 * directory as the `docs` static site; see the note there for why `root`
 * points inside `dist/docs`.
 *
 * The sidebar is the table of contents for the whole product: 18 capabilities,
 * 16 use cases across 5 segments, and the build guide. A capability added to
 * `app/Support/content/features.ts` needs a page here too - the dashboard
 * lists every marketed capability whether or not a farm has switched it on, so
 * an undocumented one becomes visible immediately.
 */
const config: BunPressOptions = {
  verbose: false,
  docsDir: './docs',
  outDir: './dist/docs',

  nav: [
    { text: 'Guide', link: '/guide/introduction' },
    { text: 'Capabilities', link: '/features/' },
    { text: 'Use cases', link: '/use-cases/' },
    { text: 'Build', link: '/build/' },
    {
      text: 'More',
      items: [
        { text: 'Costs', link: '/build/costs' },
        { text: 'Suppliers', link: '/build/suppliers' },
        { text: 'Regulation', link: '/build/regulation' },
        { text: 'HTTP API', link: '/guide/api' },
        { text: 'openfarm.ing', link: 'https://openfarm.ing' },
        { text: 'GitHub', link: 'https://github.com/theopenfarm/openfarm.ing' },
      ],
    },
  ],

  markdown: {
    title: 'Open Farming Documentation',
    meta: {
      description: 'Autonomous drone scouting and targeted treatment for farms. How the platform works, how each capability is built, and what the hardware costs.',
      author: 'Open Farming',
    },
    syntaxHighlightTheme: 'github-dark',
    css: theme,
    toc: {
      enabled: true,
      minDepth: 2,
      maxDepth: 3,
    },
    sidebar: {
      '/': [
        {
          text: 'Guide',
          collapsed: false,
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'The interface', link: '/guide/interface' },
            { text: 'Quickstart', link: '/guide/quickstart' },
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'Content model', link: '/guide/content' },
            { text: 'HTTP API', link: '/guide/api' },
            { text: 'The farmer console', link: '/guide/dashboard' },
            { text: 'The field map', link: '/guide/field-map' },
            { text: 'Commands', link: '/guide/commands' },
            { text: 'Deployment', link: '/guide/deployment' },
            { text: 'Testing', link: '/guide/testing' },
          ],
        },
        {
          text: 'Capabilities',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/features/' },
            { text: 'Targeted weed control', link: '/features/targeted-weed-control' },
            { text: 'Early disease detection', link: '/features/plant-disease-detection' },
            { text: 'Automated pest monitoring', link: '/features/pest-monitoring' },
            { text: 'Precision fertilisation', link: '/features/precision-fertilisation' },
            { text: 'Irrigation analysis', link: '/features/irrigation-analysis' },
            { text: 'Yield forecasting', link: '/features/yield-forecasting' },
            { text: 'Automated field mapping', link: '/features/field-mapping' },
            { text: 'Wildlife detection', link: '/features/wildlife-rescue' },
            { text: 'Drone seeding', link: '/features/drone-seeding' },
            { text: 'Frost protection', link: '/features/frost-protection' },
            { text: 'Pollination support', link: '/features/pollination-support' },
            { text: 'Livestock and fences', link: '/features/livestock-and-fences' },
            { text: 'Bird deterrence', link: '/features/bird-deterrence' },
            { text: 'Soil compaction', link: '/features/soil-compaction' },
            { text: 'Sustainability reporting', link: '/features/sustainability-dashboard' },
            { text: 'Flights as a service', link: '/features/drone-service' },
            { text: 'Autonomous drone network', link: '/features/autonomous-network' },
            { text: 'Field decision assistant', link: '/features/field-assistant' },
          ],
        },
        {
          text: 'Use cases',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/use-cases/' },
            { text: 'Arable', link: '/use-cases/arable' },
            { text: 'Permanent crops', link: '/use-cases/permanent' },
            { text: 'Protected crops', link: '/use-cases/protected' },
            { text: 'Grassland and livestock', link: '/use-cases/livestock' },
            { text: 'Operators', link: '/use-cases/operators' },
          ],
        },
        {
          text: 'Build',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/build/' },
            { text: 'Airframes', link: '/build/airframes' },
            { text: 'Sensors', link: '/build/sensors' },
            { text: 'Positioning', link: '/build/positioning' },
            { text: 'Compute', link: '/build/compute' },
            { text: 'Docks', link: '/build/docks' },
            { text: 'Payloads', link: '/build/payloads' },
            { text: 'Costs', link: '/build/costs' },
            { text: 'Suppliers', link: '/build/suppliers' },
            { text: 'Regulation', link: '/build/regulation' },
          ],
        },
        {
          text: 'Software stack',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/build/software/' },
            { text: 'Flight stack', link: '/build/software/flight-stack' },
            { text: 'Ingest and photogrammetry', link: '/build/software/ingest' },
            { text: 'Perception models', link: '/build/software/perception' },
            { text: 'Prescriptions', link: '/build/software/prescriptions' },
            { text: 'Platform', link: '/build/software/platform' },
          ],
        },
      ],
    },

    /*
     * `themeConfig` lives under `markdown`, not at the top level. bunpress
     * accepts both, and the top-level one is the documented home, but the
     * build path this project uses only reads the nested one - the footer and
     * the social links silently disappear from the built site when it is moved
     * up a level.
     */
    themeConfig: {
      logo: '/images/logos/logo-transparent.svg',
      footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright 2026-present Open Farming',
      },
      socialLinks: [
        { icon: 'github', link: 'https://github.com/theopenfarm/openfarm.ing' },
      ],
    },
  },

  sitemap: {
    enabled: true,
    baseUrl: 'https://openfarm.ing/docs',
  },

  robots: {
    enabled: true,
  },
}

export default config
