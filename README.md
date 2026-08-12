# Open Farming

Autonomous drone scouting for farms, at [openfarm.ing](https://openfarm.ing).

A drone flies a fixed route over a field, models locate what is actually wrong
(weeds by species, disease by divergence from the field's own history, dry
ground by canopy temperature), and the findings become a prescription the
machine you already own can load. On the demonstration field that means the
boom opens over **4.34 of 24.6 hectares** instead of all of it.

This repository is the marketing site and the public API behind it, built on
[Stacks](https://github.com/stacksjs/stacks).

The documentation lives in `docs/` and is published at
[openfarm.ing/docs](https://openfarm.ing/docs): how the platform works, all 18
capabilities and 16 use cases, and a build guide covering the hardware, the
suppliers, the in-house software stack, the costs and the regulation. Build it
locally with `./buddy build:docs`.

---

## What is here

| Path | What lives there |
|---|---|
| `app/Support/content/` | The source of truth for all site content: 18 capabilities, 16 use cases, and the demonstration field's generator |
| `app/Support/catalog.ts` | The shared read layer. Every page and every endpoint goes through it |
| `app/Support/fieldmap.ts` | Renders a field to SVG, server side, from the flight record |
| `app/Models/` | Nine models: `Feature`, `UseCase`, the operational domain (`Farm`, `Field`, `Drone`, `Mission`, `Detection`, `TreatmentMap`) and `DemoRequest` |
| `app/Actions/Catalog/` | The public read API |
| `app/Actions/Leads/` | The field-visit booking endpoint, the only public write of its own |
| `app/Actions/SubscriberEmailAction.ts` | The framework's subscribe handler, published into userland |
| `app/Commands/CatalogSync.ts` | `buddy catalog:sync`, which publishes the content into the database |
| `resources/views/` | The site. `features/[slug].stx` and `use-cases/[slug].stx` render every detail page |
| `public/site.css` | The design tokens, and the CSS that utilities cannot express |
| `config/cloud.ts` | Deploy configuration: a tenant on the shared Stacks box |

### The maps are real

Every orange mark on this site is a row in the database. `demo-field.ts`
generates the dataset deterministically (a fixed-seed PRNG, no `Date`, no
`Math.random`) with the spatial structure weed pressure actually has: a
headland band where the sprayer turns, four tramline corridors, and two
established patches. 98 detections cluster into 62 treatment zones on a grid a
boom's section control can resolve.

Because it is deterministic, the database, the API and the rendered SVG always
agree, and the figures quoted in the copy cannot drift. It is **modelled** data
rather than a customer's field, and the site says so wherever it appears.

---

## Running it

Requires Bun >= 1.3.0.

```bash
bun install
```

```bash
./buddy migrate && ./buddy catalog:sync
```

```bash
./buddy dev
```

The site is then on `http://localhost:3100`. This project owns :3100/:3108/:3106
so it can run alongside another Stacks app. For pretty HTTPS URLs
(`https://openfarming.localhost`) run `./buddy setup:ssl` once; it needs sudo to
bind :443 and to trust the local certificate authority.

### Editing content

Capability and use-case copy lives in `app/Support/content/`. After an edit:

```bash
./buddy catalog:sync
```

The command truncates and rewrites, so it is safe to re-run, and it validates
that every cross-reference between a feature and a use case resolves before
writing anything. A deploy runs it automatically, so content edits ship with
the code.

---

## The API

Public and unauthenticated. It serves exactly what the pages render, so the two
cannot drift apart.

| Endpoint | Returns |
|---|---|
| `GET /api/features` | Every capability, grouped. `?category=detect\|act\|operate` filters |
| `GET /api/features/{slug}` | One capability with its related use cases resolved |
| `GET /api/use-cases` | Every operation, grouped by segment |
| `GET /api/use-cases/{slug}` | One operation with its capabilities in priority order |
| `GET /api/field-report` | The whole flight record: every detection and the prescription geometry |
| `POST /api/demo-requests` | Records a field-visit enquiry. Rate limited |
| `POST /api/email/subscribe` | Records a subscriber. Rate limited, deduplicated |

`/api/field-report` carries `sample: true` in the payload so no consumer can
present those figures as a customer's results by accident.

Both write endpoints answer a browser form post with a redirect to a
confirmation page (`/booked`, `/subscribed`) and a `fetch` caller with JSON. The
forms are plain server-rendered HTML and work with no client bundle at all,
which is the point on a phone in a farmyard.

---

## Deploying

The site runs as a tenant on the shared Stacks Hetzner box: this project does
not own a server. `config/cloud.ts` attaches to the `stacks` project, ships
three sites (`main` on :3060, a loopback-only `api` on :3068, and a `www`
redirect) and adds its own rpx gateway fragment. SQLite lives at
`/var/lib/openfarming/stacks.sqlite`, outside the atomic release directories,
so the catalog and any enquiries survive a deploy.

**Pushing to `main` deploys production.** The CI workflow gates the deploy on
lint, typecheck and tests, so a red build means no deploy. The credentials it
needs are repository secrets: `DEPLOY_SSH_KEY`, `HCLOUD_TOKEN`,
`PORKBUN_API_KEY`, `PORKBUN_SECRET_KEY`, `APP_KEY` and
`DOTENV_PRIVATE_KEY_PRODUCTION`.

To deploy by hand:

```bash
APP_ENV=production APP_URL=openfarm.ing ./buddy deploy --prod --yes
```

`.env.production` is committed with every value encrypted; the deploy decrypts
it locally with the key in `.env.keys` (gitignored) and ships plaintext to the
box. Nothing readable is in git.

One thing the deploy does not do is issue the TLS certificate. On a first
deploy to a new domain, run the generated renewal script on the box once, or
the site serves another tenant's certificate:

```bash
ssh root@178.105.248.188 'sh /etc/rpx/renew-certs-openfarming.sh'
```

---

## Conventions

- Lint with `bunx --bun pickier .`, never eslint. `--fix` handles class ordering.
- Typecheck the application with `bun run typecheck:app`.
- This project runs on the **published** `@stacksjs/*` packages rather than a
  vendored `storage/framework/core`. `buddy unpublish:core --all` is what moved
  it there; `buddy publish:core <pkg>` brings one package back when you need to
  edit framework source in place.
- stx directives take bare identifiers: `@foreach (items as item)`, `{{ item.name }}`.
- No em-dashes in anything a visitor reads.

## Licence

MIT.
