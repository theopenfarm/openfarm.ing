import { Action } from '@stacksjs/actions'
import { rateLimit } from '@stacksjs/router'
import DemoRequest from '../../Models/DemoRequest'
import { seeOther, wantsHtml } from '../../Support/formResponse'

/**
 * `POST /api/demo-requests`
 *
 * The only write this application accepts from the public internet, so
 * everything about it is deliberately narrow: a rate limit per IP, an explicit
 * allow-list of fields (the model's `fillable` flags back this up), and a
 * response that says whether it worked and nothing else. No record id, no
 * echo of the stored row, nothing an enumeration attempt could learn from.
 */
export default new Action({
  name: 'DemoRequestAction',
  description: 'Record a field-visit enquiry from the public site',
  method: 'POST',

  async handle(request: RequestInstance) {
    // A farmer filling this in once will never notice; a script will.
    await rateLimit('demo-request', 5).per('minute')

    const name = String(request.get('name') || '').trim()
    const email = String(request.get('email') || '').trim()

    // A browser form post is answered with a redirect to a confirmation page
    // rather than a JSON body the visitor would be left staring at. A `fetch`
    // caller gets the JSON contract unchanged. The page (rather than a query
    // string on /contact) is because stx server scripts receive no request
    // URL, so a view cannot read its own query string.
    const html = wantsHtml(request)

    if (name.length < 2) {
      return html
        ? seeOther('/contact#book')
        : { success: false, message: 'Please give us a name we can use.' }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return html
        ? seeOther('/contact#book')
        : { success: false, message: 'That email address does not look right.' }
    }

    // `hectares` arrives from a number input, so it can be an empty string.
    const rawHectares = String(request.get('hectares') || '').trim()
    const hectares = rawHectares === '' ? null : Number(rawHectares)

    try {
      await DemoRequest.create({
        name: name.slice(0, 160),
        email: email.slice(0, 255),
        farm_name: String(request.get('farm_name') || '').trim().slice(0, 200),
        segment: String(request.get('segment') || '').trim().slice(0, 80),
        ...(hectares !== null && Number.isFinite(hectares) && hectares >= 0 ? { hectares } : {}),
        message: String(request.get('message') || '').trim().slice(0, 2000),
        status: 'new',
        source: String(request.get('source') || 'contact').trim().slice(0, 160),
      })
    }
    catch (error) {
      // The visitor gets a usable sentence; the detail goes to the log, where
      // it belongs. Echoing a database error back would leak schema.
      console.error('[DemoRequestAction] could not record enquiry:', error instanceof Error ? error.message : error)
      return html
        ? seeOther('/contact#book')
        : { success: false, message: 'We could not record that. Try again, or email hello@openfarm.ing.' }
    }

    return html
      ? seeOther('/booked')
      : { success: true, message: 'Booked. We will be in touch within two working days.' }
  },
})
