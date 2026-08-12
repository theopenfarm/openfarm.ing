# Quickstart

This repository is the marketing site, the farmer console and the public API.
It runs on [Stacks](https://github.com/stacksjs/stacks) and requires
Bun >= 1.3.0.

## Install and run

```bash
bun install
```

```bash
./buddy migrate && ./buddy catalog:sync
```

```bash
./buddy dev
```

The site is then on `http://localhost:3100`. This project owns ports
:3100, :3108 and :3106 so it can run alongside another Stacks application.

For pretty HTTPS URLs (`https://openfarming.localhost`), run this once. It
needs sudo to bind :443 and to trust the local certificate authority.

```bash
./buddy setup:ssl
```

## A dashboard with something in it

`catalog:sync` publishes the capability catalog and the demonstration field.
The demonstration farm is deliberately **unowned**, so it appears on no
dashboard and cannot leak into somebody's real numbers. To get a console with
data in it, seed some holdings and attach them to an account.

```bash
./buddy seed
```

```bash
./buddy user:add demo@openfarm.ing --password 'a-long-password'
```

```bash
./buddy demo:account demo@openfarm.ing
```

`demo:account --all` attaches every unowned seeded farm rather than just the
busiest one. `--detach` hands them back.

## What just happened

| Command | Effect |
|---|---|
| `./buddy migrate` | Creates the schema for the nine models |
| `./buddy catalog:sync` | Truncates and rewrites `features`, `use_cases`, and the demonstration farm, field, mission, detections and treatment map |
| `./buddy seed` | Fills the operational models from the per-attribute factories with plausible random rows |
| `./buddy demo:account` | Assigns ownership, which the seeder deliberately does not do |

`catalog:sync` is safe to re-run and is the way a content edit reaches
production. It truncates first, and it validates that every cross-reference
between a feature and a use case resolves before writing anything. A deploy
runs it automatically through `preStart`.

## Editing content

Capability and use case copy lives in `app/Support/content/`. After an edit:

```bash
./buddy catalog:sync
```

See [Content model](/guide/content) for the shape of those files and the rules
the seeder enforces.

## Checks before you push

```bash
bunx --bun pickier .
```

```bash
bun run typecheck:app
```

```bash
./buddy test
```

Lint with `pickier`, never eslint. `--fix` handles class ordering. The CI
workflow gates the deploy on all three, so a red build means no deploy.

## Conventions worth knowing on day one

- stx directives take bare identifiers: `@foreach (items as item)`,
  `{{ item.name }}`.
- No em-dashes in anything a visitor reads.
- This project runs on the **published** `@stacksjs/*` packages rather than a
  vendored `storage/framework/core`. `buddy publish:core <pkg>` brings one
  package back into the tree when you need to edit framework source in place;
  `buddy unpublish:core --all` is what moved it out.
- The demonstration field is generated, not listed. Never hand-edit a figure
  quoted in the copy: change the generator and let the number follow.
