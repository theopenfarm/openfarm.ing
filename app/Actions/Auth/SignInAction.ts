import { Action } from '@stacksjs/actions'
import { Auth, authCookie, RateLimiter } from '@stacksjs/auth'
import { rateLimit } from '@stacksjs/router'
import { seeOther, wantsHtml } from '../../Support/formResponse'

/**
 * Sign in from the site's own form.
 *
 * The framework's `LoginAction` answers with a JSON token pack, which is the
 * right contract for an API client and useless to a browser form: there is
 * nowhere to put a bearer token, and the visitor ends up looking at JSON.
 * This is the same `Auth` logic answered with a `Set-Cookie` and a redirect,
 * using the cookie-session helpers in `@stacksjs/auth`.
 *
 * Failures come back to /login with the reason in the path rather than a
 * query string: an stx server script cannot read its own query string, so a
 * real path is the only way the page can say what went wrong. The reason is
 * deliberately vague — "those details did not match" — so the form cannot be
 * used to find out which addresses have accounts.
 */
export default new Action({
  name: 'SignInAction',
  description: 'Sign a farmer in from the site login form',
  method: 'POST',

  async handle(request: RequestInstance) {
    // Two limits, because they stop different things. This one is per IP and
    // caps how fast one machine can guess at all; the framework's per-email
    // lockout below stops one account being ground down from many machines.
    await rateLimit('sign-in', 20).per('minute')

    const email = String(request.get('email') ?? '').trim().toLowerCase()
    const password = String(request.get('password') ?? '')

    if (!email || !password) {
      if (wantsHtml(request))
        return seeOther('/login?e=failed')

      return { success: false, message: 'Email and password are required' }
    }

    if (await RateLimiter.isRateLimited(email)) {
      if (wantsHtml(request))
        return seeOther('/login?e=locked')

      return { success: false, message: 'Too many attempts. Try again later.' }
    }

    const result = await Auth.login({ email, password })

    if (!result) {
      await RateLimiter.recordFailedAttempt(email)

      if (wantsHtml(request))
        return seeOther('/login?e=failed')

      return { success: false, message: 'Those details did not match an account' }
    }

    if (wantsHtml(request)) {
      return new Response(null, {
        status: 303,
        headers: {
          'Location': '/account',
          'Set-Cookie': authCookie(String(result.token)),
        },
      })
    }

    return { success: true, token: result.token }
  },
})
