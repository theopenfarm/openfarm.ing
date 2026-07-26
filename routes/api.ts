import { route } from '@stacksjs/router'

/**
 * This file is the entry point for your application's API routes.
 * The routes defined here are automatically registered. Last but
 * not least, you may also create any other `routes/*.ts` files.
 *
 * Framework routes (auth, dashboard, commerce, CMS, etc.) are loaded
 * automatically from storage/framework/defaults/routes/dashboard.ts.
 * You do NOT need to define them here — only add your own custom routes.
 *
 * @see https://docs.stacksjs.com/routing
 */

/**
 * The catalog, served publicly and unauthenticated.
 *
 * It is the same content the marketing pages render, so there is nothing here
 * worth gating, and publishing it keeps the site and the API reading one
 * source: if `/api/features` and `/features` ever disagree, that is a bug
 * rather than a stale copy.
 */
route.get('/features', 'Actions/Catalog/FeatureIndexAction')
route.get('/features/{slug}', 'Actions/Catalog/FeatureShowAction')
route.get('/use-cases', 'Actions/Catalog/UseCaseIndexAction')
route.get('/use-cases/{slug}', 'Actions/Catalog/UseCaseShowAction')

/**
 * The full flight record behind every map on the site. The payload carries
 * `sample: true` so nobody can present the figures as a customer's results.
 */
route.get('/field-report', 'Actions/Catalog/FieldReportAction')

/**
 * The only write accepted from the public internet. Rate limited per IP and
 * narrow about what it stores; see the action for the reasoning.
 *
 * `skipCsrf()` because the form is server rendered as plain HTML with no
 * session and no token round-trip. CSRF protects a logged-in user from having
 * their own authority used against them, and there is no authority here: the
 * endpoint appends a lead and returns nothing an attacker could not post
 * directly. The rate limit is what actually guards it.
 */
route.post('/demo-requests', 'Actions/Leads/DemoRequestAction').skipCsrf()

// `/coming-soon` is served as an STX view from
// `storage/framework/defaults/resources/views/coming-soon.stx`. The
// view auto-resolves through stx-serve, so no route registration is
// needed here. To activate the holding page across the whole app:
//
//   ./buddy coming-soon [--secret=my-magic-token]
//
// Launch the site with `./buddy launch`. Maintenance mode (503 page,
// distinct cookie + state file) is the separate `./buddy down` /
// `./buddy up` pair.
