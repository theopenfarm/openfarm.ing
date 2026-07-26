import { Action } from '@stacksjs/actions'
import { logoutCookie } from '@stacksjs/auth'
import { seeOther, wantsHtml } from '../../Support/formResponse'

/**
 * Sign out.
 *
 * POST rather than a link, so a prefetch or an image tag on some other site
 * cannot sign a farmer out. `logoutCookie` revokes the token before clearing
 * the cookie, so a copy of the cookie taken beforehand is dead too.
 */
export default new Action({
  name: 'SignOutAction',
  description: 'Sign the current farmer out',
  method: 'POST',

  async handle(request: RequestInstance) {
    // `logoutCookie` only needs the Cookie header, which RequestInstance
    // carries on `headers` exactly as a raw Request does.
    const cleared = await logoutCookie(request as unknown as { headers: Headers })

    if (wantsHtml(request)) {
      return new Response(null, {
        status: 303,
        headers: { 'Location': '/', 'Set-Cookie': cleared },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': cleared },
    })
  },
})
