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
