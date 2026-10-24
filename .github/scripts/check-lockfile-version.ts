/** Keep the frozen lock format aligned with CI and the declared Bun runtime. */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Native Bun 1.4.4 preserves this application lock in format 1. */
export const EXPECTED_LOCKFILE_VERSION = 1

/** Parse the lockfileVersion field without requiring a successful install. */
export function lockfileVersion(contents: string): number | null {
  const match = contents.match(/"lockfileVersion"\s*:\s*(\d+)/)
  return match ? Number(match[1]) : null
}

if (import.meta.main) {
  const path = resolve(import.meta.dir, '..', '..', 'bun.lock')
  const version = lockfileVersion(readFileSync(path, 'utf8'))
  if (version === EXPECTED_LOCKFILE_VERSION) {
    console.log(`✓ bun.lock is lockfileVersion ${version}`)
  }
  else {
    console.error(
      `bun.lock uses format ${version ?? 'unknown'}, but the pinned Bun 1.4.4 toolchain uses format ${EXPECTED_LOCKFILE_VERSION} for this application.\n`
      + 'Regenerate it with bunx bun@1.4.4 install --ignore-scripts, then commit bun.lock.\n'
      + 'Keep CI, the declared runtime and container Bun versions aligned.',
    )
    process.exit(1)
  }
}
