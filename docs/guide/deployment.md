# Deployment

The site runs as a tenant on the shared Stacks Hetzner box. This project does
not own a server, which is the cheapest sensible arrangement for a site of this
size and is worth stating plainly rather than implying otherwise.

## What config/cloud.ts sets up

It attaches to the `stacks` project and ships:

| Site | Port | Purpose |
|---|---|---|
| `main` | 3060 | The public site |
| `api` | 3068 | Loopback only |
| `www` | | Redirect to the apex |

Plus its own rpx gateway fragment.

SQLite lives at `/var/lib/openfarming/stacks.sqlite`, **outside** the atomic
release directories, so the catalog and any enquiries survive a deploy.

## Pushing to main deploys production

The CI workflow gates the deploy on lint, typecheck and tests. A red build
means no deploy.

The credentials it needs are repository secrets:

| Secret | For |
|---|---|
| `DEPLOY_SSH_KEY` | SSH to the box |
| `HCLOUD_TOKEN` | Hetzner API |
| `PORKBUN_API_KEY`, `PORKBUN_SECRET_KEY` | DNS |
| `APP_KEY` | Application key |
| `DOTENV_PRIVATE_KEY_PRODUCTION` | Decrypting `.env.production` |

## Deploying by hand

```bash
APP_ENV=production APP_URL=openfarm.ing ./buddy deploy --prod --yes
```

`.env.production` is committed with every value encrypted. The deploy decrypts
it locally with the key in `.env.keys`, which is gitignored, and ships
plaintext to the box. Nothing readable is in git.

## The one thing the deploy does not do

It does not issue the TLS certificate. On a first deploy to a new domain, run
the generated renewal script on the box once, or the site serves another
tenant's certificate:

```bash
ssh root@178.105.248.188 'sh /etc/rpx/renew-certs-openfarming.sh'
```

## The documentation site

### Public discovery

`buddy site:discovery` uses the installed stx generators to write `public/robots.txt`,
`public/sitemap.xml` and `public/sitemap-pages.xml`. The production `preStart` hook runs
it before the server starts, and stx serves these files through its native static-file
handler. A generation error stops the release startup.

The root sitemap is an index linking the marketing sitemap and `/docs/sitemap.xml`,
which the separate docs build generates. Marketing URLs come from an explicit public
page list, the capability and use-case catalogs, and the herding scenarios, in English,
German and Dutch. Account, dashboard, API, login, registration and form-result pages
are excluded. Regenerate the files after changing these catalogs during local development.

The deployment hook generates these files through the native stx serialization APIs.
The explicit public-page policy keeps private and account routes out of the published
sitemaps. Generated discovery files are ignored build output.

### Serving the docs

`openfarm.ing/docs` is a separate static site in the same deploy. `buddy
deploy` runs its build locally, ships the rendered directory to
`/var/www/openfarming-docs`, and the rpx gateway answers `/docs` from it. The
`main` app keeps `/`, and the longer route matches first.

Two details in `config/cloud.ts` are load bearing:

- **`deploy: 'server'`.** A site with no `start` and no explicit target
  resolves to `bucket`, and the Hetzner deploy path skips bucket sites, so the
  docs would build locally and silently never ship.
- **`root` points inside `dist/docs`,** because bunpress writes its rendered
  output to `<outDir>/.bunpress`.

Build with `./buddy build docs` or `bun run buddy build:docs`. Stacks resolves
the project's installed BunPress CLI and propagates a failed build. The deploy
also checks that `dist/docs/.bunpress` exists before packaging the output.

### Theming

The docs carry Open Farming's palette rather than the theme's default indigo,
which mattered once the pages filled up with
[screenshots](/guide/interface) of an orange product. The values in
`config/docs.ts` are the tokens from `public/site.css`, so the documentation
and the thing it documents are the same colour.

The palette, light and dark variants, local font declarations and screenshot
styles live together in the application's `markdown.css`. This is ordinary
application styling. The pinned BunPress 0.2.25 also supports `themeConfig`
colors, fonts, CSS variables and raw CSS in static builds. Both top-level
`themeConfig` and `markdown.themeConfig` reach the shared layout renderer;
when a key appears in both, the top-level value wins.

### Search under `/docs`

The native docs build uses BunPress 0.2.25, which includes the
[source fix](https://github.com/stacksjs/bunpress/commit/096004cc6e7b4800bfd1e90993866c9011ca706d)
for deployment paths in search results. Selecting a page or section stays under
`/docs`, preserving section anchors, locale fallback and explicit root deployments.
Dependencies are consumed as released packages. Make shared engine changes in
BunPress's source repository, release them, then upgrade this app and rerun the
public search regressions, native docs build and browser checks. This changes
documentation navigation, not the flight pipeline.

## Application runtime

Each atomic `main` and `api` release installs Bun 1.4.4 into its own `pantry/`
directory using the pinned Pantry SDK. The shared host's Bun bootstraps the
frozen JavaScript dependency install and that native runtime installer. The
application build, commands and services then use `./pantry/.bin/bun`.

The startup hook exports the release's absolute runtime directory into its
shell `PATH` and checks both the direct runtime and a real `bun` child before
discovery, migration or catalog publication. This export matters because service
environment variables do not configure the deployment hook's shell. Service
`PATH` also starts with the release's `pantry/.bin`, so its child commands use
the same runtime. This does not upgrade the shared server's
Bun or Pantry binaries. A runtime installation or version-check failure stops
startup.

### Scheduled work

The main site explicitly owns the single scheduler for `app/Scheduler.ts`.
The API does not start another copy. Native ts-cloud 0.16.70 runs this scheduler
with `backgroundBun: 'pantry/.bin/bun'`, using the physical release directory
for its executable, working directory and child-command `PATH`.

The native deployment stops background work before replacing an existing
release directory. After activation it reconciles the services before pruning
old releases, so a running task retains its admitted runtime and assets until
it stops. A refused stop fails deployment rather than removing those assets.
The runtime entry validates executable identity and containment before loading
application work. A same-ID replacement that fails after draining may require
a recovery deploy to restart background work.

The app consumes the maintained public package through its normal dependency
lockfile. It does not override ts-cloud with an older release or rewrite
installed packages or host units. This scheduler creates planning records;
it does not dispatch aircraft or mark a physical mission complete.

## preStart

`catalog:sync` publishes content from `app/Support/content/` on every deploy.
It refreshes the capability and use-case tables, retains the reserved demo farm,
field and aircraft IDs, and restores soft-deleted demo farm and field records.
Derived demo missions, detections and treatments are rebuilt. Existing published
orthomosaic metadata is copied to the new demo mission; customer records remain
outside the refresh.

The command refuses a reserved demo farm owned by an account, or a reserved
field or aircraft attached to another farm, before changing business rows.
[Stacks 0.75.301](https://github.com/stacksjs/stacks/releases/tag/v0.75.301)
repairs missing owner columns on empty legacy trait pivots during native
migration. A populated ambiguous pivot fails migration without assigning an
owner. Migration failures stop startup before catalog publication.

## Where the flight pipeline would run

This repository is the site and the API. The processing pipeline described in
the [build section](/build/) does not belong on the same box: photogrammetry
and model inference want a GPU and hours of wall clock, and the site wants to
answer in milliseconds.

The sane split, and the one the build pages assume:

| Tier | Runs | Sizing |
|---|---|---|
| Web | This repository | A tenant on a shared box, as above |
| Object storage | Raw frames, orthomosaics, model artefacts | Cheap bulk storage. See [Platform](/build/software/platform) |
| Processing | Stitching, inference, prescription export | One GPU box, on demand |

The only contract between them is the flight record: a processing run finishes
by writing missions, detections and treatment maps, and by calling
`imagery:attach` for the stitch. Nothing in the site knows how any of it was
produced.
