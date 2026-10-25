import { expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { runBoundedProcess } from '@stacksjs/cli/process'

test('native cookie sessions confine farmer API reads to owned holdings', async () => {
  const evidence = process.env.FARM_ACCESS_EVIDENCE
  if (evidence) await mkdir(resolve(evidence), { recursive: true, mode: 0o700 })
  const directory = await mkdtemp(join(evidence ? resolve(evidence) : tmpdir(), 'open-farming-access-'))
  const database = join(directory, 'access.sqlite')
  const env = { ...process.env, APP_ENV: 'test', NODE_ENV: 'test', DB_CONNECTION: 'sqlite', DB_DATABASE_PATH: database }
  const cwd = resolve(import.meta.dir, '../..')
  let complete = false
  try {
    for (const [name, args] of [
      ['migrate', ['node_modules/@stacksjs/buddy/dist/cli.js', 'migrate']],
      ['access', ['tests/fixtures/farmer-access.ts']],
    ] as const) {
      const result = await runBoundedProcess([process.execPath, '--no-install', '--no-env-file', ...args], {
        cwd, env, timeoutMs: 60_000, stdoutBytes: 1_048_576, stderrBytes: 262_144, strictUtf8: true, label: `Farmer access ${name}`,
      })
      await writeFile(join(directory, `${name}.stdout`), result.stdout, { mode: 0o600, flag: 'wx' })
      await writeFile(join(directory, `${name}.stderr`), result.stderr, { mode: 0o600, flag: 'wx' })
      expect(result.exitCode, `${result.stdout}\n${result.stderr}`).toBe(0)
      if (name === 'access') {
        const oracle = result.stdout.split('\n').find(line => line.startsWith('{"oracle":"native-farmer-read-ownership"'))
        expect(oracle).toBeDefined()
        console.log(oracle)
      }
    }
    complete = true
  }
  finally {
    await writeFile(join(directory, 'lifecycle.json'), JSON.stringify({ complete, database, scope: 'Private native migration, actual cookie credentials, native routes and ORM. No production records or live mail transports.' }), { mode: 0o600, flag: 'wx' })
    if (complete) await rm(directory, { recursive: true })
    else console.error('FARM_ACCESS_FIXTURE_RETAINED', directory)
  }
}, 150_000)
