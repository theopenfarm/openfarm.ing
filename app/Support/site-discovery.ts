import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { generateRobotsTxt, generateSitemap, generateSitemapIndex } from '@stacksjs/stx/seo'
import site from '../../site.config'
import { features } from './content/features'
import { useCases } from './content/use-cases'
import { scenarios } from './herding/scenarios'

/** Only authored public pages. Auth, operations and form receipts are never advertised. */
export function publicDiscoveryPaths(): string[] {
  const { locales, defaultLocale } = site.i18n ?? { locales: ['en'], defaultLocale: 'en' }
  const pages = [
    '/', '/features', '/use-cases', '/how-it-works', '/pricing', '/contact', '/field-report', '/playground/herding',
    ...features.map(feature => `/features/${feature.slug}`),
    ...useCases.map(useCase => `/use-cases/${useCase.slug}`),
    ...scenarios.map(scenario => `/playground/herding/${scenario.slug}`),
  ]
  return [...new Set(locales.flatMap(locale => pages.map(path => locale === defaultLocale ? path : `/${locale}${path}`)))]
}

/** Native stx serialization and static delivery support this app's older production server. */
export function siteDiscoveryDocuments(): Record<string, string> {
  return {
    'sitemap-pages.xml': generateSitemap(publicDiscoveryPaths().map(loc => ({ loc })), { baseUrl: site.url, includeLastmod: false }),
    'sitemap.xml': generateSitemapIndex(['/sitemap-pages.xml', '/docs/sitemap.xml'], site.url),
    'robots.txt': generateRobotsTxt({ rules: [{ userAgent: '*', allow: ['/'], disallow: ['/api/'] }], sitemap: `${site.url}/sitemap.xml` }),
  }
}

export async function writeSiteDiscovery(publicDirectory = join(process.cwd(), 'public')): Promise<void> {
  await mkdir(publicDirectory, { recursive: true })
  for (const [file, content] of Object.entries(siteDiscoveryDocuments()))
    await writeFile(join(publicDirectory, file), content)
}
