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

/**
 * The farmer's own session.
 *
 * These are the site's forms, not the API: they answer a browser post with a
 * cookie and a redirect. The framework's own token endpoints (`/login`,
 * `/register`, `/auth/*`) stay registered and unchanged for API clients.
 *
 * `skipCsrf()` for the same reason the other public forms do: the pages are
 * server-rendered HTML with no token round-trip. Sign-in and sign-up carry no
 * authority to borrow — a forged cross-site post can only sign someone in as
 * themselves — and both are rate limited per IP and per email. Sign-out is
 * POST-only so a prefetched link cannot trigger it.
 */
route.post('/auth/sign-in', 'Actions/Auth/SignInAction').skipCsrf()
route.post('/auth/sign-up', 'Actions/Auth/SignUpAction').skipCsrf()
route.post('/auth/sign-out', 'Actions/Auth/SignOutAction').skipCsrf()

/**
 * Google and Apple sign-in.
 *
 * GET on both halves because that is what an OAuth redirect is. The CSRF
 * defence here is the `state` cookie the redirect sets and the callback
 * checks, not a form token: the provider posts the farmer back from another
 * origin, where a token from this site could not travel.
 */
route.get('/auth/{provider}/redirect', 'Actions/Auth/SocialRedirectAction').skipCsrf()
route.get('/auth/{provider}/callback', 'Actions/Auth/SocialCallbackAction').skipCsrf()
