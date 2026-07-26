import { Action } from '@stacksjs/actions'
import { Auth, authCookie, register } from '@stacksjs/auth'
import { rateLimit } from '@stacksjs/router'
import { seeOther, wantsHtml } from '../../Support/formResponse'

/**
 * Create an account from the site's own form.
 *
 * `register()` is the framework's, so the password rules, the bcrypt cost,
 * the timing-equalised duplicate handling and the `user:registered` event all
 * come from one place. What changes is the answer: a cookie and a redirect
 * rather than a JSON token, and a sign-in straight after, because a farmer
 * who has just typed a password should not have to type it again.
 */
export default new Action({
  name: 'SignUpAction',
  description: 'Create an account from the site signup form',
  method: 'POST',

  async handle(request: RequestInstance) {
    await rateLimit('sign-up', 10).per('minute')

    const email = String(request.get('email') ?? '').trim().toLowerCase()
    const password = String(request.get('password') ?? '')
    const name = String(request.get('name') ?? '').trim()

    if (!name || name.length < 2) {
      if (wantsHtml(request))
        return seeOther('/register?e=invalid')

      return { success: false, message: 'A name is required' }
    }

    if (password.length < 8) {
      if (wantsHtml(request))
        return seeOther('/register?e=weak')

      return { success: false, message: 'Passwords must be at least 8 characters' }
    }

    try {
      await register({ email, password, name })
    }
    catch (error) {
      // 409 is the framework's duplicate-email signal (422 when the app has
      // enumeration prevention on, which sends the visitor down the same
      // path). Anything else is a real failure and should not be dressed up
      // as a form validation message.
      //
      // Read the status off the error rather than testing `instanceof
      // HttpError`: the app and the linked framework package can each hold
      // their own copy of the class, and the identity check then fails on a
      // perfectly ordinary duplicate — which is how a signup with a known
      // address ended up returning a raw 409 to the browser.
      const status = Number((error as { status?: number, statusCode?: number })?.status
        ?? (error as { statusCode?: number })?.statusCode
        ?? 500)

      if (status === 409 || status === 422) {
        if (wantsHtml(request))
          return seeOther('/register?e=exists')

        return { success: false, message: 'That account could not be created' }
      }

      throw error
    }

    const result = await Auth.login({ email, password })

    if (!result) {
      // The account exists; only the automatic sign-in did not happen. Send
      // them to the form they can complete rather than reporting a failure
      // for something that succeeded.
      if (wantsHtml(request))
        return seeOther('/login')

      return { success: true, message: 'Account created' }
    }

    if (wantsHtml(request)) {
      return new Response(null, {
        status: 303,
        headers: {
          'Location': '/dashboard',
          'Set-Cookie': authCookie(String(result.token)),
        },
      })
    }

    return { success: true, token: result.token }
  },
})
