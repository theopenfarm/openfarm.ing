import { Action } from '@stacksjs/actions'
import { rateLimit } from '@stacksjs/router'
import { providerFor, stateCookie, supportedProvider } from '../../Support/social'
import { seeOther } from '../../Support/formResponse'

/**
 * Start a Google or Apple sign-in.
 *
 * The provider classes come from `@stacksjs/socials`, so the URLs, scopes and
 * PKCE handling are the framework's. What this adds is the half OAuth cannot
 * do for you: a random `state` stashed in a short-lived, httpOnly cookie and
 * checked on the way back, which is what stops another site from driving a
 * visitor through a callback that signs them into someone else's account.
 */
export default new Action({
  name: 'SocialRedirectAction',
  description: 'Send a farmer to Google or Apple to sign in',
  method: 'GET',

  async handle(request: RequestInstance) {
    await rateLimit('social-redirect', 30).per('minute')

    const name = supportedProvider(String(request.getParam('provider') ?? ''))
    if (!name)
      return seeOther('/login?e=failed')

    const provider = providerFor(name)
    if (!provider)
      // Not configured on this deployment: the buttons are hidden in that
      // case, so this is somebody hitting the URL directly.
      return seeOther('/login?e=unavailable')

    const state = crypto.randomUUID()
    const url = await provider.withState(state).getAuthUrl()

    return new Response(null, {
      status: 303,
      headers: {
        'Location': url,
        'Set-Cookie': stateCookie(name, state),
      },
    })
  },
})
