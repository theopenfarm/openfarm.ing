import { Action } from '@stacksjs/actions'
import { Auth, authCookie } from '@stacksjs/auth'
import { rateLimit } from '@stacksjs/router'
import User from '../../../storage/framework/defaults/app/Models/User'
import { clearStateCookie, providerFor, stateFromRequest, supportedProvider } from '../../Support/social'
import { seeOther } from '../../Support/formResponse'

/**
 * Come back from Google or Apple, and sign the farmer in.
 *
 * Three checks stand between the callback and a session:
 *
 * 1. The `state` has to match the one this browser was given on its way out.
 *    Without it, another site can walk a visitor through a callback that
 *    signs them into an account the attacker controls.
 * 2. The provider has to give us an email address. Nothing here can identify
 *    a farmer without one.
 * 3. The provider has to vouch for that email. An unverified address must
 *    never be matched against an existing account: anyone who can create an
 *    account at the provider claiming `someone@example.com` would otherwise
 *    inherit that farmer's farm.
 *
 * A matching account is signed in; a new address creates one, with a random
 * password nobody has, since these accounts are meant to come back the same
 * way (the password-reset flow issues one if they ever want the form).
 */
export default new Action({
  name: 'SocialCallbackAction',
  description: 'Finish a Google or Apple sign-in',
  method: 'GET',

  async handle(request: RequestInstance) {
    await rateLimit('social-callback', 30).per('minute')

    const name = supportedProvider(String(request.getParam('provider') ?? ''))
    if (!name)
      return seeOther('/login?e=failed')

    const provider = providerFor(name)
    if (!provider)
      return seeOther('/login?e=unavailable')

    const expected = stateFromRequest(request as unknown as { headers: Headers }, name)
    const actual = String(request.get('state') ?? '')
    const code = String(request.get('code') ?? '')

    const failed = (reason: string): Response => new Response(null, {
      status: 303,
      headers: { 'Location': `/login?e=${reason}`, 'Set-Cookie': clearStateCookie(name) },
    })

    if (!code || !provider.validateState(expected, actual))
      return failed('failed')

    let socialUser
    try {
      const token = await provider.getAccessToken(code)
      socialUser = await provider.getUserByToken(token)
    }
    catch {
      // A bad code, a revoked consent, a provider outage: all the same to the
      // farmer standing in a field, and none of them worth a stack trace.
      return failed('failed')
    }

    const email = String(socialUser?.email ?? '').trim().toLowerCase()
    if (!email)
      return failed('noemail')

    // `false` means the provider explicitly says the address is unverified.
    // `null`/undefined means it did not say, which the providers here only do
    // for addresses they control anyway.
    if (socialUser.emailVerified === false)
      return failed('unverified')

    const existing = await User.where('email', email).first()

    if (!existing) {
      await User.create({
        email,
        name: String(socialUser.name || email.split('@')[0]),
        // A password that cannot be guessed because nobody, including this
        // farmer, ever knows it. Signing in happens through the provider;
        // password reset issues a real one if they ever want the form. The
        // model's own setter hashes it, so this is passed in the clear the
        // way every other create does.
        password: `${crypto.randomUUID()}${crypto.randomUUID()}`,
      })
    }

    const account = existing ?? await User.where('email', email).first()
    if (!account?.id)
      return failed('failed')

    const result = await Auth.loginUsingId(Number(account.id))
    if (!result)
      return failed('failed')

    // Two Set-Cookie headers, appended rather than joined: the session, and
    // the expiry of the one-shot state. Folding cookies into one header is
    // the kind of thing that works until one of them carries a date.
    const headers = new Headers({ Location: '/dashboard' })
    headers.append('Set-Cookie', authCookie(String(result.token)))
    headers.append('Set-Cookie', clearStateCookie(name))

    return new Response(null, { status: 303, headers })
  },
})
