import { Action } from '@stacksjs/actions'
import { isUniqueViolation } from '@stacksjs/orm'
// The models themselves, not the `@stacksjs/orm` re-exports: those resolve to
// the wrong thing in the published package (`Subscriber` types as a boolean),
// and importing the definition gives the narrowed model API.
import Subscriber from '../../storage/framework/defaults/app/Models/Subscriber'
import SubscriberEmail from '../../storage/framework/defaults/app/Models/SubscriberEmail'
import { rateLimit } from '@stacksjs/router'
import { sendSubscriptionConfirmation } from '../../storage/framework/defaults/app/Mail/SubscriptionConfirmation'
import { seeOther, wantsHtml } from '../Support/formResponse'

/**
 * Published from the framework default with `buddy publish:action` so the
 * capture forms on this site can be plain server-rendered HTML.
 *
 * The only change is the response: a browser form post is answered with a
 * redirect back to the page it came from carrying the outcome, instead of a
 * JSON body the visitor would be left staring at. A `fetch` caller still gets
 * the JSON contract unchanged. Everything else (the rate limit, the
 * duplicate handling, the confirmation mail) is the framework's.
 */
function backTo(request: RequestInstance, outcome: string): Response {
  // A confirmation PAGE rather than a query string on the page it came from:
  // stx server scripts receive no request URL, so a view cannot read its own
  // query string to decide what to say. A real path can.
  if (outcome === 'invalid') {
    const source = String(request.get('source') || 'footer')
    return seeOther(source === 'field-report' ? '/field-report#subscribe' : '/#subscribe')
  }

  return seeOther('/subscribed')
}

export default new Action({
  name: 'SubscriberEmailAction',
  description: 'Save emails from subscribe page and send confirmation email',
  method: 'POST',

  async handle(request: RequestInstance) {
    // Per-IP throttle. The endpoint is unauthenticated and skipCsrf'd so
    // bots will find it; without this they can flood the subscribers
    // table within minutes and burn through SES/SendGrid quota. 10/min
    // is generous for a real human filling the same form repeatedly.
    await rateLimit('email-subscribe', 10).per('minute')

    const email = request.get('email')
    const source = request.get('source') || 'homepage'

    if (!email || !email.includes('@')) {
      if (wantsHtml(request))
        return backTo(request, 'invalid')

      return { success: false, message: 'A valid email is required' }
    }

    // Check if subscriber already exists
    const existingSubscriber = await Subscriber.where('email', email).first()
    if (existingSubscriber) {
      if (wantsHtml(request))
        return backTo(request, 'already')

      return { success: true, message: 'Already subscribed' }
    }

    // Create subscriber record. The check above is a fast path; two requests
    // for the same email can still both pass it and race into the
    // subscribers.email unique index (#1957). Treat the loser's unique
    // violation as the same "already subscribed" success — the response
    // contract (and its enumeration semantics) is unchanged.
    let subscriber: any
    try {
      subscriber = await Subscriber.create({ email, status: 'subscribed', source })
    }
    catch (err) {
      if (isUniqueViolation(err)) {
        if (wantsHtml(request))
          return backTo(request, 'already')

        return { success: true, message: 'Already subscribed' }
      }
      throw err
    }

    // Log the email event
    await SubscriberEmail.create({ email, source })

    // Send subscription confirmation email asynchronously (do not block the response)
    sendSubscriptionConfirmation({
      to: email,
      subscriberUuid: subscriber.uuid,
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`Failed to send confirmation email to ${email}:`, message)
    })

    if (wantsHtml(request))
      return backTo(request, 'yes')

    return { success: true, subscriber }
  },
})
