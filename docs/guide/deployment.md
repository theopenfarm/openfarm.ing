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

This app uses Stacks 0.74.66, whose production server does not mount the newer native
request-time discovery handler. The generated files use the existing native serialization
and serving APIs without replacing the production server. They are ignored build output.

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

The build command is `bun run buddy build:docs`, not `./buddy build:docs`. The
build action shells out to `bunpress build`, and the only thing that puts that
binary on PATH is `bun run`, which prepends `node_modules/.bin`. Worse, the
failure is silent: the action logs "Executable not found" and still exits 0.
The `&& test -d dist/docs/.bunpress` after it is the guard, so a build that
quietly produces nothing fails at the build rather than at the packaging.

### Theming

The docs carry Open Farming's palette rather than the theme's default indigo,
which mattered once the pages filled up with
[screenshots](/guide/interface) of an orange product. The values in
`config/docs.ts` are the tokens from `public/site.css`, so the documentation
and the thing it documents are the same colour.

It goes through `markdown.css` rather than `themeConfig.colors`. The theme
config's `colors`, `fonts`, `cssVars` and `css` keys are typed and documented,
and bunpress's dev server honours them, but the code path that renders the
static build in the version pinned here does not, so setting them themes the
site you develop and not the one you ship. `markdown.css` reaches both.

There is a related upstream fix: `generateThemeOverrideCss` read only the
top-level `themeConfig`, while the Stacks config nests it under `markdown`, so
a nested palette was a silent no-op. Once a bunpress release carries both that
and the build-path fix, this block can move to `themeConfig` and shrink.

### Search under `/docs`

The native docs build uses BunPress 0.2.25, which includes the
[source fix](https://github.com/stacksjs/bunpress/commit/096004cc6e7b4800bfd1e90993866c9011ca706d)
for deployment paths in search results. Selecting a page or section stays under
`/docs`, preserving section anchors, locale fallback and explicit root deployments.
Dependencies are consumed as released packages. Make shared engine changes in
BunPress's source repository, release them, then upgrade this app and rerun the
public search regressions, native docs build and browser checks. This changes
documentation navigation, not the flight pipeline.

## preStart

`catalog:sync` runs on every deploy through `preStart`, so a content edit in
`app/Support/content/` ships with the code and needs no separate step. Because
the sync truncates and rewrites, a deploy also repairs a database whose catalog
tables have drifted.

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
