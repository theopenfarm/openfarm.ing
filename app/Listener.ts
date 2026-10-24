import { bootAppListeners } from '@stacksjs/events'
import { path as p } from '@stacksjs/path'

// Share the framework boot registry so HTTP and CLI entrypoints register once.
export async function handleEvents(): Promise<number> {
  return bootAppListeners({ base: p.projectPath() })
}
