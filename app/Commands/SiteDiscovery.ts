import { defineCommand, log } from '@stacksjs/cli'
import { publicDiscoveryPaths, writeSiteDiscovery } from '../Support/site-discovery'

export default defineCommand({
  name: 'site:discovery',
  description: 'Generate public marketing and documentation discovery files',
  async handle() {
    await writeSiteDiscovery()
    log.success(`Generated discovery files for ${publicDiscoveryPaths().length} localized public pages and the documentation sitemap.`)
    await log.flush()
  },
})
