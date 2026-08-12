import type { BunPressOptions } from '@stacksjs/bunpress'

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
