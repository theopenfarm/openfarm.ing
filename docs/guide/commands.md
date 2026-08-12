# Commands

Buddy is the CLI. `./buddy <command>`. Framework commands are documented by
Stacks; this page covers the ones this application adds in `app/Commands/`,
plus the framework commands you will actually use here.

## catalog:sync

```bash
./buddy catalog:sync
```

Publishes everything the site and the public API serve:

1. The capability catalog and the use cases, from the content modules that are
   their source of truth.
2. The demonstration field: one farm, one field, one weed-mapping flight, its
   98 detections and the prescription that came out of it.

It is a command rather than a seeder on purpose. `buddy seed` walks models
carrying a `useSeeder` trait and fills them from the per-attribute `factory`
functions, which is exactly right for plausible **random** rows and exactly
wrong here: this is authored content, and the field is a fixed dataset whose
figures are quoted in the copy, so it has to come out identical on every
machine. Publishing it is a deploy step, not a seed.

Re-running is safe. Every table is truncated first, so this is also how a
content edit reaches production. `preStart` runs it on every deploy.

It validates every cross-reference between a feature and a use case before
writing anything, so a rename that was mirrored in only one file fails the sync
instead of producing a dead link.

## imagery:attach

```bash
./buddy imagery:attach ./lindenbach-2026-04-18.webp --bounds="-0.04,-0.03,1.05,1.02" --resolution 4
```

Puts a flight's stitched orthomosaic behind its map. A command rather than an
upload form because this is a publishing step, run once per flight by whoever
did the stitching, against a file that is not the sort of thing anyone wants to
push through a browser.

Full options and the reason `--bounds` needs an equals sign are in
[The field map](/guide/field-map#attaching-an-orthomosaic).

## demo:account

```bash
./buddy demo:account demo@openfarm.ing
./buddy demo:account demo@openfarm.ing --all
./buddy demo:account demo@openfarm.ing --detach
```

Gives the demo login a farm to look at. The seeded holdings come out of
`buddy seed`, which fills them from the per-attribute factories. What it
deliberately does not do is decide who owns them: `Farm.user_id` seeds as null,
because a seeder that pointed a holding at a random existing account would, on
a real database, hand a farmer somebody else's invented fields.

The demonstration farm published by `catalog:sync` is left alone. It has no
owner so that it shows up on no dashboard.

## og:images

```bash
./buddy og:images
```

Generates the Open Graph share cards. Covered by
`tests/unit/share-cards.test.ts`.

## The usual sequence on a fresh machine

```bash
./buddy migrate
./buddy seed
./buddy catalog:sync
./buddy user:add demo@openfarm.ing --password 'a-long-password'
./buddy demo:account demo@openfarm.ing
```

## Framework commands used here

| Command | Purpose |
|---|---|
| `./buddy dev` | Site on :3100, API on :3108 |
| `./buddy migrate` | Apply migrations |
| `./buddy seed` | Fill the operational models from factories |
| `./buddy test` | Run the test suite |
| `./buddy lint` / `lint:fix` | Pickier. Never eslint |
| `./buddy deploy --prod --yes` | Deploy. See [Deployment](/guide/deployment) |
| `./buddy setup:ssl` | Trust a local CA and serve `https://openfarming.localhost` |
| `./buddy coming-soon [--secret=token]` | Put the holding page up across the app |
| `./buddy launch` | Take the holding page down |
| `./buddy down` / `./buddy up` | Maintenance mode, a separate 503 page and state file |
| `./buddy publish:core <pkg>` | Bring one framework package back into the tree to edit it |
| `./buddy unpublish:core --all` | Move back to the published packages |

`bun run typecheck:app` typechecks the application. `docs:links:check` and
`docs:artifacts:check` validate documentation links and artifacts in CI.
