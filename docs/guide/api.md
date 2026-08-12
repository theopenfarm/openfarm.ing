# HTTP API

Public and unauthenticated. It serves exactly what the pages render, so the two
cannot drift apart.

Base URL: `https://openfarm.ing/api` in production, `http://localhost:3100/api`
in development.

## Endpoints

| Endpoint | Returns |
|---|---|
| `GET /api/features` | Every capability, grouped. `?category=detect\|act\|operate` filters |
| `GET /api/features/{slug}` | One capability with its related use cases resolved |
| `GET /api/use-cases` | Every operation, grouped by segment |
| `GET /api/use-cases/{slug}` | One operation with its capabilities in priority order |
| `GET /api/field-report` | The whole flight record: every detection and the prescription geometry |
| `POST /api/demo-requests` | Records a field-visit enquiry. Rate limited |
| `POST /api/email/subscribe` | Records a subscriber. Rate limited, deduplicated |
| `GET /api/v1/status` | Version and liveness |

## GET /api/features

```bash
curl https://openfarm.ing/api/features
```

```json
{
  "categories": [
    { "key": "detect", "label": "Detect", "blurb": "Sensing flights that find the problem while it is still small." },
    { "key": "act", "label": "Act", "blurb": "Treatment that follows the map, so only the affected ground is touched." },
    { "key": "operate", "label": "Operate", "blurb": "The service, the fleet and the reporting that keep it running." }
  ],
  "count": 18,
  "data": [
    {
      "slug": "targeted-weed-control",
      "name": "Targeted weed control",
      "category": "act",
      "tagline": "Spray the weeds, not the field",
      "summary": "Cameras and on-board models find weeds plant by plant, then only the affected square metres get treated.",
      "problem": "Blanket spraying treats the whole field because nobody knows which parts actually carry weeds. ...",
      "steps": [{ "title": "Scan", "text": "The drone flies a fixed grid at low altitude ..." }],
      "sensors": ["RGB camera at 1 cm/px", "Downward LiDAR for canopy height", "RTK positioning"],
      "outputs": ["Weed density map", "ISOXML / shapefile prescription", "..."],
      "cadence": "Two to four scouting flights per crop, timed to the herbicide windows.",
      "readings": ["Treated area as a share of field area", "..."],
      "useCases": ["winter-wheat", "maize", "sugar-beet", "organic-farms", "contractors"],
      "order": 1
    }
  ]
}
```

`?category=` accepts `detect`, `act` or `operate`. An unknown value returns an
empty `data` array with `count: 0`, not an error.

## GET /api/features/{slug}

Adds a resolved `useCases` array so a consumer does not have to make sixteen
follow-up calls to render a page.

```bash
curl https://openfarm.ing/api/features/plant-disease-detection
```

```json
{
  "data": {
    "slug": "plant-disease-detection",
    "name": "Early disease detection",
    "useCases": [
      { "slug": "winter-wheat", "name": "Winter wheat and barley", "tagline": "...", "summary": "..." }
    ]
  }
}
```

An unknown slug returns `{ "success": false, "message": "No capability with the slug \"...\"" }`.
The slug is stripped to `[a-z0-9-]` before lookup.

## GET /api/use-cases and /api/use-cases/{slug}

The same shape, keyed by segment instead of category. `?segment=` accepts
`arable`, `permanent`, `protected`, `livestock` or `operator`.

The detail endpoint resolves `features` **in the order the use case lists
them**, most load bearing first. A slug with no matching feature is dropped
rather than emitted as a null.

## GET /api/field-report

The whole flight record behind every map on the site.

```bash
curl https://openfarm.ing/api/field-report
```

```json
{
  "data": {
    "sample": true,
    "farm": "Hofgut Lindenbach",
    "region": "Niederbayern",
    "field": "Lindenbach Nord",
    "crop": "winter wheat",
    "hectares": 24.6,
    "flownAt": "2026-04-18 06:40:00",
    "resolutionCm": 1,
    "durationMinutes": 31,
    "detections": [
      { "kind": "weed", "label": "Chickweed", "x": 0.3099, "y": 0.9686,
        "area_m2": 110, "severity": "low", "confidence": 0.628 }
    ],
    "zones": [{ "x": 0.6875, "y": 0, "w": 0.0625, "h": 0.0455, "rate": 110 }],
    "boundary": [[0.04, 0.02], [0.97, 0.05]],
    "imagery": {
      "url": "/imagery/lindenbach-2026-04-18.webp",
      "bounds": [-0.04, -0.03, 1.05, 1.02],
      "resolutionCm": 4
    },
    "treatedHectares": 4.34,
    "treatedPercent": 17.6,
    "speciesBreakdown": [{ "label": "Blackgrass", "count": 38 }]
  }
}
```

### Read this before you render it

`sample: true` is part of the payload rather than a note in these docs, so a
consumer cannot present these figures as a customer's results by accident. It
is modelled data. If you display it, say so.

### Coordinate space

`x`, `y`, `boundary` and `zones` are all in **normalised field space**: 0..1 on
each axis, with the origin at the top left. There is no projection. A renderer
places a detection at `(x * width, y * height)` inside the field's own bounding
box and needs no geospatial library at all.

`imagery.bounds` is `[minX, minY, maxX, maxY]` in that same space. The numbers
are normally slightly outside 0..1, because a stitch always covers more ground
than the boundary: the aircraft overflies the edges. Draw the image to exactly
that footprint. Letterboxing it would shift every pixel away from the detection
drawn on top of it.

`imagery` is `null`, not an empty object, when the flight has no stitch. A
renderer has to be able to tell "no imagery" from "imagery covering nothing".

An instance with no seeded flight record answers
`{ "success": false, "message": "No flight record has been seeded on this instance." }`.

## POST /api/demo-requests

The only write this application accepts from the public internet, so everything
about it is deliberately narrow.

| Field | Required | Limit |
|---|---|---|
| `name` | yes, min 2 characters | 160 |
| `email` | yes, must match a basic address shape | 255 |
| `farm_name` | no | 200 |
| `segment` | no | 80 |
| `hectares` | no, must be a finite number >= 0 | |
| `message` | no | 2000 |

```bash
curl -X POST https://openfarm.ing/api/demo-requests \
  -H 'Content-Type: application/json' \
  -d '{"name":"A Farmer","email":"a@example.com","hectares":268}'
```

Rate limited to 5 per minute per IP. The response says whether it worked and
nothing else: no record id, no echo of the stored row, nothing an enumeration
attempt could learn from.

A browser form post is answered with a `303` redirect to `/booked` instead, and
a validation failure redirects to `/contact#book`. A `fetch` caller gets the
JSON contract unchanged. The forms are plain server-rendered HTML and work with
no client bundle at all, which is the point on a phone in a farmyard.

## POST /api/email/subscribe

The framework's subscribe handler, published into userland at
`app/Actions/SubscriberEmailAction.ts`. Rate limited and deduplicated.
Redirects a browser to `/subscribed`.

## Why there is no CSRF token

`route.post(...).skipCsrf()` is on every form post on this site, which is
worth explaining rather than hiding.

CSRF protects a signed-in user from having their own authority used against
them. `POST /api/demo-requests` carries no authority: it appends a lead and
returns nothing an attacker could not post directly. The rate limit is what
actually guards it.

For the console's own forms the reasoning is different: the session cookie is
`SameSite=Lax`, so a cross-site form post carries no session at all. Sign-in
and sign-up carry no authority to borrow either, since a forged cross-site post
can only sign somebody in as themselves, and both are rate limited per IP and
per email.

The OAuth callbacks are GET because that is what an OAuth redirect is. Their
CSRF defence is the `state` cookie the redirect sets and the callback checks,
not a form token, because the provider posts the farmer back from another
origin where a token from this site could not travel.

## Generated REST endpoints

The models carry `useApi` traits, so the operational domain also has generated
CRUD endpoints. Those are **not** public: they sit behind `Auth` and then
`FarmScope`, which pins every read to the caller's own holdings and rejects a
write naming a farm they do not own. See
[Architecture](/guide/architecture#multi-tenancy).
